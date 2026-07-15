import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentService } from '../../payments/payment.service';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, HeadingLevel, TextRun, AlignmentType, BorderStyle } from 'docx';
import PDFDocument from 'pdfkit';

export interface DashboardWaitlist {
  id: string;
  name: string;
  tagline: string;
  slug: string;
  totalParticipants: number;
  description?: string | null;
  logoUrl?: string | null;
}

export interface DashboardParticipant {
  email: string;
  position: number;
  referralCount: number;
  createdAt: Date;
  status: string;
}

export interface PaginationMetadata {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface DashboardWaitlistDetail {
  waitlist: DashboardWaitlist;
  participants: DashboardParticipant[];
  pagination?: PaginationMetadata;
}

export interface DashboardOverview {
  totalSignups: number;
  referralConversionRate: number;
  topReferrers: Array<{
    email: string;
    referralCount: number;
    waitlistName: string;
  }>;
  waitlistCount: number;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  /** Get the Founder ID from a User ID */
  private async getFounderId(userId: string): Promise<string> {
    const founder = await this.prisma.founder.findUnique({
      where: { userId },
    });

    if (!founder) {
      throw new NotFoundException('Founder profile not found');
    }

    return founder.id;
  }

  // ── Overview stats for the founder dashboard ─────────────────────────────
  async getOverview(userId: string): Promise<DashboardOverview> {
    const founderId = await this.getFounderId(userId);

    const waitlists = await this.prisma.waitlist.findMany({
      where: { founderId },
      select: {
        name: true,
        participants: {
          select: {
            email: true,
            referralCount: true,
            referredById: true,
          },
        },
      },
    });

    const participants = waitlists.flatMap((waitlist) =>
      waitlist.participants.map((participant) => ({
        ...participant,
        waitlistName: waitlist.name,
      })),
    );

    const totalSignups = participants.length;
    const referredSignups = participants.filter((p) => p.referredById).length;
    const referralConversionRate =
      totalSignups > 0 ? Math.round((referredSignups / totalSignups) * 1000) / 10 : 0;

    // Top referrers - available to all users
    const topReferrers = participants
      .filter((p) => p.referralCount > 0)
      .sort((a, b) => b.referralCount - a.referralCount)
      .slice(0, 5)
      .map((p) => ({
        email: p.email,
        referralCount: p.referralCount,
        waitlistName: p.waitlistName,
      }));

    return {
      totalSignups,
      referralConversionRate,
      topReferrers,
      waitlistCount: waitlists.length,
    };
  }

  // ── List all waitlists owned by the founder ──────────────────────────────
  async getWaitlists(userId: string): Promise<DashboardWaitlist[]> {
    const founderId = await this.getFounderId(userId);

    const waitlists = await this.prisma.waitlist.findMany({
      where: { founderId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { participants: true },
        },
        logo: true,
      },
    });

    return waitlists.map((w) => ({
      id: w.id,
      name: w.name,
      tagline: w.tagline,
      slug: w.slug,
      totalParticipants: w._count.participants,
      description: w.description,
      logoUrl: w.logo?.url || null,
    }));
  }

  // ── Get a single waitlist with its participants (paginated) ───────────────
  async getWaitlistDetail(
    waitlistId: string,
    userId: string,
    options?: {
      page?: number;
      pageSize?: number;
      search?: string;
      sortBy?: 'position' | 'referralCount' | 'createdAt';
      sortOrder?: 'asc' | 'desc';
      status?: 'WAITING' | 'INVITED' | 'ACCESSED';
    },
  ): Promise<DashboardWaitlistDetail> {
    const founderId = await this.getFounderId(userId);

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const search = options?.search || '';
    const sortBy = options?.sortBy || 'position';
    const sortOrder = options?.sortOrder || 'asc';
    const status = options?.status;

    // Build where clause to find the waitlist itself
    const where: any = { id: waitlistId, founderId };

    // Get total count for pagination
    const totalParticipants = await this.prisma.participant.count({
      where: {
        waitlistId,
        ...(search && {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        }),
        ...(status && { status }),
      },
    });

    const totalPages = Math.ceil(totalParticipants / pageSize);
    const skip = (page - 1) * pageSize;

    const waitlist = await this.prisma.waitlist.findFirst({
      where,
      include: {
        _count: { select: { participants: true } },
        logo: true,
        participants: {
          where: {
            ...(search && {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            }),
            ...(status && { status }),
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: pageSize,
          select: {
            email: true,
            position: true,
            referralCount: true,
            createdAt: true,
            status: true,
          },
        },
      },
    });

    if (!waitlist) {
      throw new NotFoundException(
        `Waitlist ${waitlistId} not found or not owned by this founder`,
      );
    }

    return {
      waitlist: {
        id: waitlist.id,
        name: waitlist.name,
        tagline: waitlist.tagline,
        slug: waitlist.slug,
        totalParticipants: waitlist._count.participants,
        description: waitlist.description,
        logoUrl: waitlist.logo?.url || null,
      },
      participants: waitlist.participants,
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: totalParticipants,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  // ── Generate a CSV string for a waitlist ────────────────────────────────
  async exportCsv(waitlistId: string, userId: string): Promise<{ csv: string; slug: string }> {
    const founderId = await this.getFounderId(userId);

    const waitlist = await this.prisma.waitlist.findFirst({
      where: { id: waitlistId, founderId },
      include: {
        participants: {
          orderBy: { position: 'asc' },
          select: {
            email: true,
            position: true,
            referralCount: true,
          },
        },
      },
    });

    if (!waitlist) {
      throw new NotFoundException(
        `Waitlist ${waitlistId} not found or not owned by this founder`,
      );
    }

    // Helper function to properly escape CSV values
    const escapeCsvValue = (val: unknown): string => {
      const stringified = String(val);
      if (/[",\n\r]/.test(stringified)) {
        return `"${stringified.replace(/"/g, '""')}"`;
      }
      return stringified;
    };

    const header = 'email,position,referralCount';
    const rows = waitlist.participants.map(
      (p) => [escapeCsvValue(p.email), escapeCsvValue(p.position), escapeCsvValue(p.referralCount)].join(','),
    );
    const csv = [header, ...rows].join('\n');

    return { csv, slug: waitlist.slug };
  }

  // ── Export participants in different formats ─────────────────────────────
  async exportParticipants(
    waitlistId: string,
    userId: string,
    format: 'csv' | 'xlsx' | 'doc' | 'pdf',
  ): Promise<{ data: Buffer; filename: string; contentType: string }> {
    const founderId = await this.getFounderId(userId);

    const waitlist = await this.prisma.waitlist.findFirst({
      where: { id: waitlistId, founderId },
      include: {
        participants: {
          orderBy: { position: 'asc' },
          select: {
            email: true,
            position: true,
            referralCount: true,
            createdAt: true,
            status: true,
          },
        },
      },
    });

    if (!waitlist) {
      throw new NotFoundException(
        `Waitlist ${waitlistId} not found or not owned by this founder`,
      );
    }

    const data = waitlist.participants.map((p) => ({
      Email: p.email,
      Position: p.position,
      ReferralCount: p.referralCount,
      CreatedAt: p.createdAt.toISOString(),
      Status: p.status,
    }));

    switch (format) {
      case 'csv':
        return this.exportToCsv(data, waitlist.slug);
      case 'xlsx':
        return this.exportToXlsx(data, waitlist.slug);
      case 'doc':
        return this.exportToDoc(data, waitlist.slug);
      case 'pdf':
        return this.exportToPdf(data, waitlist.slug);
      default:
        throw new NotFoundException(`Unsupported format: ${format}`);
    }
  }

  private exportToCsv(data: any[], slug: string): { data: Buffer; filename: string; contentType: string } {
    const escapeCsvValue = (val: unknown): string => {
      const stringified = String(val);
      if (/[",\n\r]/.test(stringified)) {
        return `"${stringified.replace(/"/g, '""')}"`;
      }
      return stringified;
    };

    // Format headers to be more readable
    const formattedData = data.map(row => {
      const formattedRow: any = {};
      Object.keys(row).forEach(key => {
        // Convert camelCase to readable format
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
        formattedRow[formattedKey] = row[key];
      });
      return formattedRow;
    });

    const header = Object.keys(formattedData[0]).join(',');
    const rows = formattedData.map((row) =>
      Object.values(row).map((val) => escapeCsvValue(val)).join(','),
    );
    const csv = [header, ...rows].join('\n');

    return {
      data: Buffer.from(csv),
      filename: `${slug}-participants.csv`,
      contentType: 'text/csv',
    };
  }

  private exportToXlsx(data: any[], slug: string): { data: Buffer; filename: string; contentType: string } {
    // Format headers to be more readable
    const formattedData = data.map(row => {
      const formattedRow: any = {};
      Object.keys(row).forEach(key => {
        // Convert camelCase to readable format
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
        formattedRow[formattedKey] = row[key];
      });
      return formattedRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    
    // Calculate appropriate column widths based on content
    const headers = Object.keys(formattedData[0]);
    const colWidths = headers.map((header) => {
      let maxWidth = header.length;
      formattedData.forEach((row) => {
        const cellValue = String(row[header] || '');
        maxWidth = Math.max(maxWidth, cellValue.length);
      });
      return { wch: Math.min(Math.max(maxWidth + 2, 10), 50) }; // Min 10, max 50
    });
    worksheet['!cols'] = colWidths;
    
    // Freeze header row
    worksheet['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2' };
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return {
      data: Buffer.from(excelBuffer),
      filename: `${slug}-participants.xlsx`,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  private async exportToDoc(data: any[], slug: string): Promise<{ data: Buffer; filename: string; contentType: string }> {
    // Format headers to be more readable
    const formattedData = data.map(row => {
      const formattedRow: any = {};
      Object.keys(row).forEach(key => {
        // Convert camelCase to readable format
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
        formattedRow[formattedKey] = row[key];
      });
      return formattedRow;
    });

    const headers = Object.keys(formattedData[0]);
    const colWidth = 100 / headers.length;

    const tableRows = [
      new TableRow({
        tableHeader: true,
        children: headers.map(
          (header) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: header,
                      bold: true,
                      size: 24, // 12pt
                    }),
                  ],
                  spacing: { before: 100, after: 100 },
                }),
              ],
              width: { size: colWidth, type: WidthType.PERCENTAGE },
              shading: {
                fill: "D9D9D9",
              },
              verticalAlign: "center",
              margins: {
                top: 100,
                bottom: 100,
                left: 200,
                right: 200,
              },
            }),
        ),
      }),
      ...formattedData.map(
        (row, index) =>
          new TableRow({
            children: Object.values(row).map(
              (val) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: String(val),
                          size: 20, // 10pt
                        }),
                      ],
                      spacing: { before: 50, after: 50 },
                    }),
                  ],
                  width: { size: colWidth, type: WidthType.PERCENTAGE },
                  verticalAlign: "center",
                  margins: {
                    top: 50,
                    bottom: 50,
                    left: 200,
                    right: 200,
                  },
                }),
            ),
          }),
      ),
    ];

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch
                bottom: 1440,
                left: 1440,
                right: 1440,
              },
            },
          },
          children: [
            new Paragraph({
              text: `${slug} - Participants`,
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 400 },
              alignment: "center",
            }),
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: "single", size: 1, color: "000000" },
                bottom: { style: "single", size: 1, color: "000000" },
                left: { style: "single", size: 1, color: "000000" },
                right: { style: "single", size: 1, color: "000000" },
                insideHorizontal: { style: "single", size: 1, color: "000000" },
                insideVertical: { style: "single", size: 1, color: "000000" },
              },
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return {
      data: buffer,
      filename: `${slug}-participants.docx`,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
  }

  private async exportToPdf(data: any[], slug: string): Promise<{ data: Buffer; filename: string; contentType: string }> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        resolve({
          data: Buffer.concat(chunks),
          filename: `${slug}-participants.pdf`,
          contentType: 'application/pdf',
        });
      });
      doc.on('error', reject);

      // Add title
      doc.fontSize(16).text(`${slug} - Participants`, { align: 'center' });
      doc.moveDown(2);

      // Format headers to be more readable
      const formattedData = data.map(row => {
        const formattedRow: any = {};
        Object.keys(row).forEach(key => {
          // Convert camelCase to readable format
          const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
          formattedRow[formattedKey] = row[key];
        });
        return formattedRow;
      });

      const headers = Object.keys(formattedData[0]);
      const pageWidth = doc.page.width - 100; // Account for margins
      const colWidth = pageWidth / headers.length;
      const rowHeight = 25;
      const startX = 50;
      let y = doc.y;

      // Check if we need a new page
      if (y + (formattedData.length + 1) * rowHeight > doc.page.height - 50) {
        doc.addPage();
        y = 50;
      }

      // Draw headers with background
      doc.rect(startX, y, pageWidth, rowHeight).fillAndStroke('#E8E8E8', '#333333');
      headers.forEach((header, i) => {
        doc.fontSize(10).fillColor('black').text(header, startX + i * colWidth + 5, y + 8, {
          width: colWidth - 10,
          ellipsis: true
        });
      });
      y += rowHeight;

      // Draw data rows
      formattedData.forEach((row, rowIndex) => {
        // Check if we need a new page
        if (y + rowHeight > doc.page.height - 50) {
          doc.addPage();
          y = 50;
          
          // Redraw headers on new page
          doc.rect(startX, y, pageWidth, rowHeight).fillAndStroke('#E8E8E8', '#333333');
          headers.forEach((header, i) => {
            doc.fontSize(10).fillColor('black').text(header, startX + i * colWidth + 5, y + 8, {
              width: colWidth - 10,
              ellipsis: true
            });
          });
          y += rowHeight;
        }
        
        // Alternate row background
        if (rowIndex % 2 === 0) {
          doc.rect(startX, y, pageWidth, rowHeight).fill('#F5F5F5');
        }
        
        Object.values(row).forEach((val, i) => {
          doc.fontSize(9).fillColor('black').text(String(val), startX + i * colWidth + 5, y + 8, {
            width: colWidth - 10,
            ellipsis: true
          });
        });
        y += rowHeight;
      });

      // Draw table border
      const tableHeight = (formattedData.length + 1) * rowHeight;
      doc.rect(startX, doc.y - tableHeight, pageWidth, tableHeight).stroke();

      doc.end();
    });
  }

  // ── Export all waitlists ───────────────────────────────────────────────────
  async exportWaitlists(userId: string, format: 'csv' | 'xlsx' | 'doc' | 'pdf'): Promise<{
    data: Buffer;
    filename: string;
    contentType: string;
  }> {
    const founderId = await this.getFounderId(userId);

    const waitlists = await this.prisma.waitlist.findMany({
      where: { founderId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { participants: true },
        },
        logo: true,
      },
    });

    const data = waitlists.map((w) => ({
      Name: w.name,
      Tagline: w.tagline,
      Slug: w.slug,
      Description: w.description || '',
      TotalParticipants: w._count.participants,
      CreatedAt: w.createdAt.toISOString(),
    }));

    switch (format) {
      case 'csv':
        return this.exportWaitlistsToCsv(data);
      case 'xlsx':
        return this.exportWaitlistsToXlsx(data);
      case 'doc':
        return this.exportWaitlistsToDoc(data);
      case 'pdf':
        return this.exportWaitlistsToPdf(data);
      default:
        throw new NotFoundException(`Unsupported format: ${format}`);
    }
  }

  // ── Waitlist-specific export methods for better formatting ────────────────
  private exportWaitlistsToCsv(data: any[]): { data: Buffer; filename: string; contentType: string } {
    const escapeCsvValue = (val: unknown): string => {
      const stringified = String(val);
      if (/[",\n\r]/.test(stringified)) {
        return `"${stringified.replace(/"/g, '""')}"`;
      }
      return stringified;
    };

    const header = Object.keys(data[0]).join(',');
    const rows = data.map((row) =>
      Object.values(row).map((val) => escapeCsvValue(val)).join(','),
    );
    const csv = [header, ...rows].join('\n');

    return {
      data: Buffer.from(csv),
      filename: 'waitlists.csv',
      contentType: 'text/csv',
    };
  }

  private exportWaitlistsToXlsx(data: any[]): { data: Buffer; filename: string; contentType: string } {
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Calculate appropriate column widths based on content
    const headers = Object.keys(data[0]);
    const colWidths = headers.map((header, index) => {
      let maxWidth = header.length;
      data.forEach((row) => {
        const cellValue = String(row[header] || '');
        maxWidth = Math.max(maxWidth, cellValue.length);
      });
      
      // Give more space to Description column
      if (header === 'Description') {
        return { wch: Math.min(Math.max(maxWidth + 5, 40), 80) };
      }
      if (header === 'Name') {
        return { wch: Math.min(Math.max(maxWidth + 2, 25), 50) };
      }
      if (header === 'Tagline') {
        return { wch: Math.min(Math.max(maxWidth + 2, 20), 40) };
      }
      return { wch: Math.min(Math.max(maxWidth + 2, 15), 30) };
    });
    worksheet['!cols'] = colWidths;
    
    // Freeze header row
    worksheet['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2' };
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Waitlists');
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return {
      data: Buffer.from(excelBuffer),
      filename: 'waitlists.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  private async exportWaitlistsToDoc(data: any[]): Promise<{ data: Buffer; filename: string; contentType: string }> {
    const headers = Object.keys(data[0]);
    
    // Calculate column widths - give more space to Description
    const colWidths = headers.map((header) => {
      if (header === 'Description') return 35;
      if (header === 'Name') return 25;
      if (header === 'Tagline') return 20;
      if (header === 'Slug') return 15;
      return 10;
    });
    
    const totalWidth = colWidths.reduce((sum, width) => sum + width, 0);
    const normalizedWidths = colWidths.map(width => (width / totalWidth) * 100);

    const tableRows = [
      new TableRow({
        tableHeader: true,
        children: headers.map(
          (header, index) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: header,
                      bold: true,
                      size: 24, // 12pt
                    }),
                  ],
                  spacing: { before: 100, after: 100 },
                }),
              ],
              width: { size: normalizedWidths[index], type: WidthType.PERCENTAGE },
              shading: {
                fill: "D9D9D9",
              },
              verticalAlign: "center",
              margins: {
                top: 100,
                bottom: 100,
                left: 200,
                right: 200,
              },
            }),
        ),
      }),
      ...data.map(
        (row) =>
          new TableRow({
            children: Object.values(row).map(
              (val, index) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: String(val),
                          size: 20, // 10pt
                        }),
                      ],
                      spacing: { before: 50, after: 50 },
                    }),
                  ],
                  width: { size: normalizedWidths[index], type: WidthType.PERCENTAGE },
                  verticalAlign: "center",
                  margins: {
                    top: 50,
                    bottom: 50,
                    left: 200,
                    right: 200,
                  },
                }),
            ),
          }),
      ),
    ];

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch
                bottom: 1440,
                left: 1440,
                right: 1440,
              },
            },
          },
          children: [
            new Paragraph({
              text: 'Waitlists',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 400 },
              alignment: "center",
            }),
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: "single", size: 1, color: "000000" },
                bottom: { style: "single", size: 1, color: "000000" },
                left: { style: "single", size: 1, color: "000000" },
                right: { style: "single", size: 1, color: "000000" },
                insideHorizontal: { style: "single", size: 1, color: "000000" },
                insideVertical: { style: "single", size: 1, color: "000000" },
              },
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return {
      data: buffer,
      filename: 'waitlists.docx',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
  }

  private async exportWaitlistsToPdf(data: any[]): Promise<{ data: Buffer; filename: string; contentType: string }> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        resolve({
          data: Buffer.concat(chunks),
          filename: 'waitlists.pdf',
          contentType: 'application/pdf',
        });
      });
      doc.on('error', reject);

      // Add title
      doc.fontSize(16).text('Waitlists', { align: 'center' });
      doc.moveDown(2);

      const headers = Object.keys(data[0]);
      const pageWidth = doc.page.width - 100; // Account for margins
      
      // Calculate column widths - give more space to Description
      const colWidths = headers.map((header) => {
        if (header === 'Description') return pageWidth * 0.40;
        if (header === 'Name') return pageWidth * 0.20;
        if (header === 'Tagline') return pageWidth * 0.15;
        if (header === 'Slug') return pageWidth * 0.10;
        return pageWidth * 0.15;
      });
      
      const rowHeight = 30;
      const startX = 50;
      let y = doc.y;

      // Check if we need a new page
      if (y + (data.length + 1) * rowHeight > doc.page.height - 50) {
        doc.addPage();
        y = 50;
      }

      // Draw headers with background
      doc.rect(startX, y, pageWidth, rowHeight).fillAndStroke('#E8E8E8', '#333333');
      let currentX = startX;
      headers.forEach((header, i) => {
        doc.fontSize(10).fillColor('black').text(header, currentX + 5, y + 10, {
          width: colWidths[i] - 10,
          ellipsis: true
        });
        currentX += colWidths[i];
      });
      y += rowHeight;

      // Draw data rows
      data.forEach((row, rowIndex) => {
        // Check if we need a new page
        if (y + rowHeight > doc.page.height - 50) {
          doc.addPage();
          y = 50;
          
          // Redraw headers on new page
          doc.rect(startX, y, pageWidth, rowHeight).fillAndStroke('#E8E8E8', '#333333');
          currentX = startX;
          headers.forEach((header, i) => {
            doc.fontSize(10).fillColor('black').text(header, currentX + 5, y + 10, {
              width: colWidths[i] - 10,
              ellipsis: true
            });
            currentX += colWidths[i];
          });
          y += rowHeight;
        }
        
        // Alternate row background
        if (rowIndex % 2 === 0) {
          doc.rect(startX, y, pageWidth, rowHeight).fill('#F5F5F5');
        }
        
        currentX = startX;
        Object.values(row).forEach((val, i) => {
          doc.fontSize(9).fillColor('black').text(String(val), currentX + 5, y + 10, {
            width: colWidths[i] - 10,
            ellipsis: true
          });
          currentX += colWidths[i];
        });
        y += rowHeight;
      });

      // Draw table border
      const tableHeight = (data.length + 1) * rowHeight;
      doc.rect(startX, doc.y - tableHeight, pageWidth, tableHeight).stroke();

      doc.end();
    });
  }
}
