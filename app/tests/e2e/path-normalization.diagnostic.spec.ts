import { test, expect } from '@playwright/test';
import { normalizeProjectPath, projectPathContractMatch } from './utils/pathNormalization';

test('diagnostic_path_normalization_helper_contract', () => {
  const windowsStyle = 'C:\\work\\black-skies\\sample_project\\proj_esther_estate';
  const posixStyle = '/work/black-skies/sample_project/proj_esther_estate';
  expect(normalizeProjectPath(windowsStyle)).toBe('C:/work/black-skies/sample_project/proj_esther_estate');
  expect(normalizeProjectPath(posixStyle)).toBe('/work/black-skies/sample_project/proj_esther_estate');
  expect(projectPathContractMatch({ actual: windowsStyle, expected: posixStyle })).toBe(true);
  expect(
    projectPathContractMatch({
      actual: '/tmp/projects/not_esther',
      expected: '/work/black-skies/sample_project/proj_esther_estate',
    }),
  ).toBe(false);
});

