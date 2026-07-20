import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentService } from '../../payments/payment.service';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, HeadingLevel, TextRun, AlignmentType, BorderStyle } from 'docx';
import puppeteer from 'puppeteer';

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
  async getWaitlists(
    userId: string,
    options?: {
      search?: string;
      sortBy?: 'name' | 'createdAt' | 'totalParticipants';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<DashboardWaitlist[]> {
    const founderId = await this.getFounderId(userId);

    const { search, sortBy = 'createdAt', sortOrder = 'desc' } = options || {};

    const where: any = { founderId };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tagline: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (sortBy === 'totalParticipants') {
      // For sorting by participants, we need to include the count
      const waitlists = await this.prisma.waitlist.findMany({
        where,
        include: {
          _count: {
            select: { participants: true },
          },
          logo: true,
        },
      });

      // Sort manually by participant count
      const sorted = waitlists.sort((a, b) => {
        const aCount = a._count.participants;
        const bCount = b._count.participants;
        return sortOrder === 'asc' ? aCount - bCount : bCount - aCount;
      });

      return sorted.map((w) => ({
        id: w.id,
        name: w.name,
        tagline: w.tagline,
        slug: w.slug,
        totalParticipants: w._count.participants,
        description: w.description,
        logoUrl: w.logo?.url || null,
      }));
    }

    orderBy[sortBy] = sortOrder;

    const waitlists = await this.prisma.waitlist.findMany({
      where,
      orderBy,
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

    // Generate HTML table
    let html = `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; font-size: 18px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background-color: #D9D9D9; border: 1px solid #000; padding: 8px; text-align: left; font-size: 10px; }
          td { border: 1px solid #000; padding: 8px; font-size: 9px; }
          tr:nth-child(even) { background-color: #F5F5F5; }
        </style>
      </head>
      <body>
        <h1>${slug} - Participants</h1>
        <table>
          <thead>
            <tr>
              ${headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${formattedData.map(row => `
              <tr>
                ${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: 'shell',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-extensions',
        '--disable-default-apps',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
    });
    await browser.close();

    return {
      data: Buffer.from(pdfBuffer),
      filename: `${slug}-participants.pdf`,
      contentType: 'application/pdf',
    };
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
        logo: true,
      },
    });

    const data = waitlists.map((w) => ({
      Name: w.name,
      Tagline: w.tagline,
      Slug: w.slug,
      Description: w.description || '',
      TotalParticipants: w.participants.length,
      CreatedAt: w.createdAt.toISOString(),
      Participants: w.participants,
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

    // Remove TotalParticipants and Participants from CSV export
    const csvData = data.map((row) => ({
      Name: row.Name,
      Tagline: row.Tagline,
      Slug: row.Slug,
      Description: row.Description,
      CreatedAt: row.CreatedAt,
    }));

    const header = Object.keys(csvData[0]).join(',');
    const rows = csvData.map((row) =>
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
    const workbook = XLSX.utils.book_new();

    // Create summary sheet with all waitlists
    const summaryData = data.map((waitlist) => ({
      Name: waitlist.Name,
      Tagline: waitlist.Tagline,
      Slug: waitlist.Slug,
      Description: waitlist.Description,
      TotalParticipants: waitlist.TotalParticipants,
      CreatedAt: waitlist.CreatedAt,
    }));

    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    
    // Calculate appropriate column widths for summary
    const summaryColWidths = [
      { wch: 30 }, // Name
      { wch: 40 }, // Tagline
      { wch: 25 }, // Slug
      { wch: 50 }, // Description
      { wch: 20 }, // TotalParticipants
      { wch: 25 }, // CreatedAt
    ];
    summaryWorksheet['!cols'] = summaryColWidths;
    summaryWorksheet['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2' };
    
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Waitlists Summary');

    // Create a separate sheet for each waitlist's participants
    data.forEach((waitlist, index) => {
      if (waitlist.Participants && waitlist.Participants.length > 0) {
        const participantData = waitlist.Participants.map((p: any) => ({
          Email: p.email,
          Position: p.position,
          ReferralCount: p.referralCount,
          CreatedAt: p.createdAt,
          Status: p.status,
        }));

        const participantWorksheet = XLSX.utils.json_to_sheet(participantData);
        
        // Calculate appropriate column widths for participants
        const participantColWidths = [
          { wch: 35 }, // Email
          { wch: 15 }, // Position
          { wch: 18 }, // ReferralCount
          { wch: 25 }, // CreatedAt
          { wch: 15 }, // Status
        ];
        participantWorksheet['!cols'] = participantColWidths;
        participantWorksheet['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2' };
        
        // Create a safe sheet name (max 31 chars, no special characters)
        const safeSheetName = `${waitlist.Name}_Participants`
          .replace(/[^a-zA-Z0-9]/g, '_')
          .substring(0, 31);
        
        XLSX.utils.book_append_sheet(workbook, participantWorksheet, safeSheetName);
      }
    });

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return {
      data: Buffer.from(excelBuffer),
      filename: 'waitlists.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  private async exportWaitlistsToDoc(data: any[]): Promise<{ data: Buffer; filename: string; contentType: string }> {
    // Remove TotalParticipants from headers
    const headers = ['Name', 'Tagline', 'Slug', 'Description', 'CreatedAt'];
    
    // Calculate column widths - give more space to Description
    const colWidths = [25, 20, 15, 35, 20];
    const totalWidth = colWidths.reduce((sum, width) => sum + width, 0);
    const normalizedWidths = colWidths.map(width => (width / totalWidth) * 100);

    // Create waitlist table rows (without TotalParticipants)
    const waitlistTableRows = [
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
            children: headers.map(
              (header, index) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: String(row[header]),
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

    // Build document children
    const children: any[] = [
      new Paragraph({
        text: 'Waitlists',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 400 },
        alignment: "center",
      }),
      new Table({
        rows: waitlistTableRows,
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
    ];

    // Add participant tables for each waitlist
    data.forEach((waitlist) => {
      if (waitlist.Participants && waitlist.Participants.length > 0) {
        // Add heading for this waitlist's participants
        children.push(
          new Paragraph({
            text: `Participants - ${waitlist.Name}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 600, after: 300 },
          }),
        );

        // Participant table headers
        const participantHeaders = ['Email', 'Position', 'ReferralCount', 'CreatedAt', 'Status'];
        const participantColWidths = [35, 15, 18, 25, 15];
        const participantTotalWidth = participantColWidths.reduce((sum, width) => sum + width, 0);
        const participantNormalizedWidths = participantColWidths.map(width => (width / participantTotalWidth) * 100);

        const participantTableRows = [
          new TableRow({
            tableHeader: true,
            children: participantHeaders.map(
              (header, index) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: header,
                          bold: true,
                          size: 24,
                        }),
                      ],
                      spacing: { before: 100, after: 100 },
                    }),
                  ],
                  width: { size: participantNormalizedWidths[index], type: WidthType.PERCENTAGE },
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
          ...waitlist.Participants.map((participant: any) => {
            const fieldMap: { [key: string]: string } = {
              'Email': 'email',
              'Position': 'position',
              'ReferralCount': 'referralCount',
              'CreatedAt': 'createdAt',
              'Status': 'status',
            };
            return new TableRow({
              children: participantHeaders.map(
                (header, index) => {
                  const fieldName = fieldMap[header] || header.toLowerCase();
                  return new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: String(participant[fieldName] || ''),
                            size: 20,
                          }),
                        ],
                        spacing: { before: 50, after: 50 },
                      }),
                    ],
                    width: { size: participantNormalizedWidths[index], type: WidthType.PERCENTAGE },
                    verticalAlign: "center",
                    margins: {
                      top: 50,
                      bottom: 50,
                      left: 200,
                      right: 200,
                    },
                  });
                },
              ),
            });
          }),
        ];

        children.push(
          new Table({
            rows: participantTableRows,
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
        );
      }
    });

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
          children,
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
    // Create main waitlist table (without TotalParticipants)
    const waitlistHeaders = ['Name', 'Tagline', 'Slug', 'Description', 'CreatedAt'];
    
    let html = `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; font-size: 18px; margin-bottom: 20px; }
          h2 { font-size: 14px; margin-top: 20px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background-color: #D9D9D9; border: 1px solid #000; padding: 8px; text-align: left; font-size: 11px; }
          td { border: 1px solid #000; padding: 8px; font-size: 10px; }
          tr:nth-child(even) { background-color: #F5F5F5; }
        </style>
      </head>
      <body>
        <h1>Waitlists</h1>
        <table>
          <thead>
            <tr>
              ${waitlistHeaders.map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${waitlistHeaders.map(header => `<td>${row[header] || ''}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
    `;

    // Add participant tables for each waitlist
    data.forEach((waitlist) => {
      if (waitlist.Participants && waitlist.Participants.length > 0) {
        html += `
          <h2>Participants - ${waitlist.Name}</h2>
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Position</th>
                <th>ReferralCount</th>
                <th>CreatedAt</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${waitlist.Participants.map((participant: any) => `
                <tr>
                  <td>${participant.email || ''}</td>
                  <td>${participant.position || ''}</td>
                  <td>${participant.referralCount || ''}</td>
                  <td>${participant.createdAt || ''}</td>
                  <td>${participant.status || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }
    });

    html += `
      </body>
      </html>
    `;

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: 'shell',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-extensions',
        '--disable-default-apps',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
    });
    await browser.close();

    return {
      data: Buffer.from(pdfBuffer),
      filename: 'waitlists.pdf',
      contentType: 'application/pdf',
    };
  }
}
