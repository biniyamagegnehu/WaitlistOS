import { BadRequestException } from '@nestjs/common';
import { defaultPageConfig, validatePageConfig } from './page-config';

describe('page configuration validation', () => {
  it('accepts the default controlled section set', () => {
    expect(validatePageConfig(defaultPageConfig())).toEqual(defaultPageConfig());
  });

  it('rejects arbitrary section types and executable content', () => {
    const invalid = defaultPageConfig() as any;
    invalid.sections[0].type = 'HTML';
    expect(() => validatePageConfig(invalid)).toThrow(BadRequestException);
    const executable = defaultPageConfig() as any;
    executable.sections[0].content = { headline: '<script>alert(1)</script>' };
    expect(() => validatePageConfig(executable)).toThrow(BadRequestException);
  });

  it('requires signup and prevents duplicate singleton sections', () => {
    const noSignup = defaultPageConfig();
    noSignup.sections = noSignup.sections.filter((section) => section.type !== 'SIGNUP');
    expect(() => validatePageConfig(noSignup)).toThrow(BadRequestException);
    const duplicate = defaultPageConfig() as any;
    duplicate.sections.push({ id: 'hero-two', type: 'HERO', order: 6, visible: true, content: {} });
    expect(() => validatePageConfig(duplicate)).toThrow(BadRequestException);
  });
});
