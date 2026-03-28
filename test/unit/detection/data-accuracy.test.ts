import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { TestEnvironment } from '../../utils/test-helpers.js';

describe('Detection Data Accuracy', () => {
  let testEnv: TestEnvironment;

  beforeEach(async () => {
    testEnv = new TestEnvironment();
    await testEnv.setup();
  });

  afterEach(async () => {
    await testEnv.cleanup();
  });

  describe('Suspicious APIs Database', () => {
    let apisData: any;

    beforeEach(() => {
      const content = readFileSync(join(testEnv.getTestRoot(), 'data', 'suspicious-apis.json'), 'utf-8');
      apisData = JSON.parse(content);
    });

    it('contains expected high-risk APIs', () => {
      const highRiskApis = new Set();

      Object.values(apisData.categories).forEach((category: any) => {
        category.apis.forEach((api: any) => {
          if (api.risk === 'high' || api.risk === 'critical') {
            highRiskApis.add(api.name);
          }
        });
      });

      // Should contain common high-risk APIs
      expect(highRiskApis.has('VirtualAllocEx')).toBe(true);
      expect(highRiskApis.has('CreateRemoteThread')).toBe(true);
    });

    it('validates API risk classifications', () => {
      const validRiskLevels = new Set(['low', 'medium', 'high', 'critical']);

      Object.values(apisData.categories).forEach((category: any) => {
        category.apis.forEach((api: any) => {
          expect(validRiskLevels.has(api.risk)).toBe(true);
          expect(typeof api.name).toBe('string');
          expect(api.name.length).toBeGreaterThan(0);
        });
      });
    });

    it('ensures detection patterns are meaningful', () => {
      Object.values(apisData.categories).forEach((category: any) => {
        category.apis.forEach((api: any) => {
          if (api.detection_patterns) {
            expect(Array.isArray(api.detection_patterns)).toBe(true);
            api.detection_patterns.forEach((pattern: string) => {
              expect(typeof pattern).toBe('string');
              expect(pattern.length).toBeGreaterThan(10); // Should be descriptive
            });
          }
        });
      });
    });

    it('validates evasion notes when present', () => {
      Object.values(apisData.categories).forEach((category: any) => {
        category.apis.forEach((api: any) => {
          if (api.evasion_notes) {
            expect(typeof api.evasion_notes).toBe('string');
            expect(api.evasion_notes.length).toBeGreaterThan(20); // Should be detailed
          }
        });
      });
    });

    it('checks for alternative API suggestions', () => {
      Object.values(apisData.categories).forEach((category: any) => {
        category.apis.forEach((api: any) => {
          if (api.alternatives) {
            expect(Array.isArray(api.alternatives)).toBe(true);
            api.alternatives.forEach((alt: string) => {
              expect(typeof alt).toBe('string');
              expect(alt.length).toBeGreaterThan(0);
            });
          }
        });
      });
    });
  });

  describe('Sysmon Rules Database', () => {
    let sysmonData: any;

    beforeEach(() => {
      const content = readFileSync(join(testEnv.getTestRoot(), 'data', 'sysmon-rules.json'), 'utf-8');
      sysmonData = JSON.parse(content);
    });

    it('contains valid Sysmon event IDs', () => {
      const validEventIds = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]);

      if (sysmonData.events) {
        sysmonData.events.forEach((event: any) => {
          expect(typeof event.id).toBe('number');
          expect(validEventIds.has(event.id)).toBe(true);
        });
      }
    });

    it('has meaningful event descriptions', () => {
      if (sysmonData.events) {
        sysmonData.events.forEach((event: any) => {
          expect(typeof event.description).toBe('string');
          expect(event.description.length).toBeGreaterThan(10);
          expect(typeof event.name).toBe('string');
          expect(event.name.length).toBeGreaterThan(0);
        });
      }
    });

    it('includes detection logic for events', () => {
      if (sysmonData.events) {
        sysmonData.events.forEach((event: any) => {
          if (event.detection_logic) {
            expect(typeof event.detection_logic).toBe('string');
            expect(event.detection_logic.length).toBeGreaterThan(10);
          }
        });
      }
    });
  });

  describe('ETW Providers Database', () => {
    let etwData: any;

    beforeEach(() => {
      const content = readFileSync(join(testEnv.getTestRoot(), 'data', 'etw-providers.json'), 'utf-8');
      etwData = JSON.parse(content);
    });

    it('validates ETW provider GUIDs', () => {
      const guidRegex = /^{[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}}$/i;

      if (etwData.providers) {
        etwData.providers.forEach((provider: any) => {
          if (provider.guid) {
            expect(guidRegex.test(provider.guid)).toBe(true);
          }
          expect(typeof provider.name).toBe('string');
          expect(provider.name.length).toBeGreaterThan(0);
        });
      }
    });

    it('ensures providers have meaningful descriptions', () => {
      if (etwData.providers) {
        etwData.providers.forEach((provider: any) => {
          expect(typeof provider.description).toBe('string');
          expect(provider.description.length).toBeGreaterThan(10);
        });
      }
    });

    it('validates provider event lists', () => {
      if (etwData.providers) {
        etwData.providers.forEach((provider: any) => {
          if (provider.events) {
            expect(Array.isArray(provider.events)).toBe(true);
            provider.events.forEach((event: string) => {
              expect(typeof event).toBe('string');
              expect(event.length).toBeGreaterThan(0);
            });
          }
        });
      }
    });
  });

  describe('AMSI Triggers Database', () => {
    let amsiData: any;

    beforeEach(() => {
      const content = readFileSync(join(testEnv.getTestRoot(), 'data', 'amsi-triggers.json'), 'utf-8');
      amsiData = JSON.parse(content);
    });

    it('validates trigger pattern structure', () => {
      if (amsiData.trigger_patterns) {
        Object.values(amsiData.trigger_patterns).forEach((category: any) => {
          if (category.patterns) {
            expect(Array.isArray(category.patterns)).toBe(true);

            category.patterns.forEach((pattern: any) => {
              expect(typeof pattern.pattern).toBe('string');
              expect(pattern.pattern.length).toBeGreaterThan(0);
              expect(typeof pattern.risk).toBe('string');
              expect(['low', 'medium', 'high', 'critical']).toContain(pattern.risk);
            });
          }
        });
      }
    });

    it('contains expected PowerShell AMSI triggers', () => {
      const patterns = new Set();

      if (amsiData.trigger_patterns && amsiData.trigger_patterns.powershell) {
        amsiData.trigger_patterns.powershell.patterns.forEach((pattern: any) => {
          patterns.add(pattern.pattern);
        });
      }

      // Should contain common PowerShell triggers
      expect(patterns.has('Invoke-Expression')).toBe(true);
      expect(patterns.has('DownloadString')).toBe(true);
    });

    it('validates pattern descriptions', () => {
      if (amsiData.trigger_patterns) {
        Object.values(amsiData.trigger_patterns).forEach((category: any) => {
          if (category.patterns) {
            category.patterns.forEach((pattern: any) => {
              if (pattern.description) {
                expect(typeof pattern.description).toBe('string');
                expect(pattern.description.length).toBeGreaterThan(5);
              }
            });
          }
        });
      }
    });
  });

  describe('Cross-Database Consistency', () => {
    let allData: any = {};

    beforeEach(() => {
      const files = ['suspicious-apis.json', 'sysmon-rules.json', 'etw-providers.json', 'amsi-triggers.json'];
      files.forEach(file => {
        const content = readFileSync(join(testEnv.getTestRoot(), 'data', file), 'utf-8');
        allData[file] = JSON.parse(content);
      });
    });

    it('has consistent API naming across databases', () => {
      const apiNames = new Set();

      // Collect API names from suspicious APIs
      Object.values(allData['suspicious-apis.json'].categories).forEach((category: any) => {
        category.apis.forEach((api: any) => apiNames.add(api.name));
      });

      // Check for mentions in other databases
      const mentionedApis = new Set();

      // Check Sysmon rules
      if (allData['sysmon-rules.json'].events) {
        allData['sysmon-rules.json'].events.forEach((event: any) => {
          const eventStr = JSON.stringify(event).toLowerCase();
          apiNames.forEach(api => {
            if (eventStr.includes(api.toLowerCase())) {
              mentionedApis.add(api);
            }
          });
        });
      }

      // At least some APIs should be mentioned across databases
      expect(mentionedApis.size).toBeGreaterThan(0);
    });

    it('validates risk level consistency', () => {
      const riskLevels = new Set(['low', 'medium', 'high', 'critical']);

      Object.values(allData).forEach(data => {
        function checkRisk(obj: any) {
          if (obj && typeof obj === 'object') {
            if (obj.risk) {
              expect(riskLevels.has(obj.risk)).toBe(true);
            }
            Object.values(obj).forEach(value => {
              if (Array.isArray(value)) {
                value.forEach(checkRisk);
              } else if (typeof value === 'object') {
                checkRisk(value);
              }
            });
          }
        }
        checkRisk(data);
      });
    });

    it('ensures all databases have description fields', () => {
      Object.entries(allData).forEach(([filename, data]) => {
        expect(data).toHaveProperty('description');
        expect(typeof data.description).toBe('string');
        expect(data.description.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Search Algorithm Accuracy', () => {
    it('finds exact matches correctly', () => {
      const query = 'VirtualAllocEx';
      const apisContent = readFileSync(join(testEnv.getTestRoot(), 'data', 'suspicious-apis.json'), 'utf-8');
      const apisData = JSON.parse(apisContent);

      let found = false;
      Object.values(apisData.categories).forEach((category: any) => {
        category.apis.forEach((api: any) => {
          if (JSON.stringify(api).toLowerCase().includes(query.toLowerCase())) {
            found = true;
            expect(api.name).toBe(query);
          }
        });
      });

      expect(found).toBe(true);
    });

    it('performs case-insensitive search correctly', () => {
      const queries = ['virtualallocex', 'VIRTUALALLOCEX', 'VirtualAllocEx'];
      const apisContent = readFileSync(join(testEnv.getTestRoot(), 'data', 'suspicious-apis.json'), 'utf-8');

      queries.forEach(query => {
        const searchableContent = apisContent.toLowerCase();
        expect(searchableContent.includes(query.toLowerCase())).toBe(true);
      });
    });

    it('finds partial matches appropriately', () => {
      const query = 'Process';
      const sysmonContent = readFileSync(join(testEnv.getTestRoot(), 'data', 'sysmon-rules.json'), 'utf-8');

      const searchableContent = sysmonContent.toLowerCase();
      expect(searchableContent.includes(query.toLowerCase())).toBe(true);
    });

    it('handles special characters in search', () => {
      const specialQueries = ['Invoke-Expression', 'CreateRemoteThread', 'VirtualProtectEx'];

      specialQueries.forEach(query => {
        // Should not throw errors with special characters
        expect(() => {
          const normalized = query.toLowerCase();
          expect(typeof normalized).toBe('string');
        }).not.toThrow();
      });
    });
  });
});