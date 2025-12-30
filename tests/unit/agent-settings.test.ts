// tests/unit/agent-settings.test.ts
// ✅ Tests to ensure schema alignment between TypeScript types and application logic

import { describe, it, expect } from 'vitest';
import {
  getDefaultAgentSettings,
  validateAgentSettings,
  AGENT_SETTINGS_DEFAULTS,
  AGENT_SETTINGS_CONSTRAINTS,
  mergeWithDefaults,
  getRolePersona,
  hasCustomSettings,
  getSettingsSummary,
  type AgentSettings,
} from '@/types/agent';

describe('Agent Settings Schema Alignment', () => {
  // ===== DEFAULT VALUES TESTS =====
  
  describe('getDefaultAgentSettings', () => {
    it('returns valid settings that pass validation', () => {
      const settings = getDefaultAgentSettings('https://test.com', 'sales');
      
      // Must have url to pass validation
      const settingsWithRequiredFields = {
        ...settings,
        name: 'Test Agent',
        summary: 'Test summary',
      };
      
      const validation = validateAgentSettings(settingsWithRequiredFields);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('returns defaults matching AGENT_SETTINGS_DEFAULTS constant', () => {
      const settings = getDefaultAgentSettings('https://test.com', 'support');
      
      expect(settings.tone).toBe(AGENT_SETTINGS_DEFAULTS.tone);
      expect(settings.temperature).toBe(AGENT_SETTINGS_DEFAULTS.temperature);
      expect(settings.maxTokens).toBe(AGENT_SETTINGS_DEFAULTS.maxTokens);
      expect(settings.contextRetrievalCount).toBe(AGENT_SETTINGS_DEFAULTS.contextRetrievalCount);
      expect(settings.matchThreshold).toBe(AGENT_SETTINGS_DEFAULTS.matchThreshold);
      expect(settings.leadCaptureEnabled).toBe(AGENT_SETTINGS_DEFAULTS.leadCaptureEnabled);
      expect(settings.webhookEnabled).toBe(AGENT_SETTINGS_DEFAULTS.webhookEnabled);
      expect(settings.crmEnabled).toBe(AGENT_SETTINGS_DEFAULTS.crmEnabled);
    });

    it('applies role-specific persona', () => {
      const salesSettings = getDefaultAgentSettings('https://test.com', 'sales');
      const supportSettings = getDefaultAgentSettings('https://test.com', 'support');
      
      expect(salesSettings.persona).toContain('sales');
      expect(supportSettings.persona).toContain('support');
      expect(salesSettings.persona).not.toBe(supportSettings.persona);
    });

    it('uses correct URL from parameter', () => {
      const testUrl = 'https://example.com';
      const settings = getDefaultAgentSettings(testUrl, 'sales');
      
      expect(settings.url).toBe(testUrl);
    });

    it('defaults to support role for invalid role', () => {
      const settings = getDefaultAgentSettings('https://test.com', 'invalid_role');
      
      expect(settings.role).toBe('support');
    });

    it('has empty name and summary (user must provide)', () => {
      const settings = getDefaultAgentSettings('https://test.com', 'sales');
      
      expect(settings.name).toBe('');
      expect(settings.summary).toBe('');
    });

    it('does not set optional fields (undefined by default)', () => {
      const settings = getDefaultAgentSettings('https://test.com', 'sales');
      
      expect(settings.customInstructions).toBeUndefined();
      expect(settings.webhookUrl).toBeUndefined();
      expect(settings.crmType).toBeUndefined();
      expect(settings.notificationEmail).toBeUndefined();
    });
  });

  // ===== VALIDATION TESTS =====
  
  describe('validateAgentSettings', () => {
    it('accepts valid settings with all required fields', () => {
      const validSettings: Partial<AgentSettings> = {
        url: 'https://test.com',
        name: 'Test Agent',
        persona: 'A helpful assistant with great personality',
        summary: 'Brief description',
        role: 'sales',
      };
      
      const validation = validateAgentSettings(validSettings);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('rejects missing URL', () => {
      const invalidSettings = {
        name: 'Test Agent',
        persona: 'A helpful assistant',
      };
      
      const validation = validateAgentSettings(invalidSettings);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('URL is required');
    });

    it('rejects invalid URL format', () => {
      const invalidSettings = {
        url: 'not-a-valid-url',
        name: 'Test Agent',
        persona: 'A helpful assistant',
      };
      
      const validation = validateAgentSettings(invalidSettings);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('URL'))).toBe(true);
    });

    it('enforces name length constraints', () => {
      const tooLong = 'x'.repeat(AGENT_SETTINGS_CONSTRAINTS.name.maxLength + 1);
      
      const validation = validateAgentSettings({
        url: 'https://test.com',
        name: tooLong,
        persona: 'A helpful assistant',
      });
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('Name'))).toBe(true);
    });

    it('enforces persona length constraints', () => {
      const tooShort = 'Short';
      const tooLong = 'x'.repeat(AGENT_SETTINGS_CONSTRAINTS.persona.maxLength + 1);
      
      const validationShort = validateAgentSettings({
        url: 'https://test.com',
        name: 'Test',
        persona: tooShort,
      });
      
      const validationLong = validateAgentSettings({
        url: 'https://test.com',
        name: 'Test',
        persona: tooLong,
      });
      
      expect(validationShort.valid).toBe(false);
      expect(validationLong.valid).toBe(false);
    });

    it('enforces temperature range constraints', () => {
      const validationTooLow = validateAgentSettings({
        url: 'https://test.com',
        temperature: -0.1,
      });
      
      const validationTooHigh = validateAgentSettings({
        url: 'https://test.com',
        temperature: 1.1,
      });
      
      expect(validationTooLow.valid).toBe(false);
      expect(validationTooHigh.valid).toBe(false);
    });

    it('enforces contextRetrievalCount range constraints', () => {
      const validationTooLow = validateAgentSettings({
        url: 'https://test.com',
        contextRetrievalCount: 0,
      });
      
      const validationTooHigh = validateAgentSettings({
        url: 'https://test.com',
        contextRetrievalCount: 11,
      });
      
      expect(validationTooLow.valid).toBe(false);
      expect(validationTooHigh.valid).toBe(false);
    });

    it('enforces matchThreshold range constraints', () => {
      const validationTooLow = validateAgentSettings({
        url: 'https://test.com',
        matchThreshold: 0.4,
      });
      
      const validationTooHigh = validateAgentSettings({
        url: 'https://test.com',
        matchThreshold: 0.95,
      });
      
      expect(validationTooLow.valid).toBe(false);
      expect(validationTooHigh.valid).toBe(false);
    });

    it('enforces maxTokens range constraints', () => {
      const validationTooLow = validateAgentSettings({
        url: 'https://test.com',
        maxTokens: 40,
      });
      
      const validationTooHigh = validateAgentSettings({
        url: 'https://test.com',
        maxTokens: 2100,
      });
      
      expect(validationTooLow.valid).toBe(false);
      expect(validationTooHigh.valid).toBe(false);
    });

    it('validates webhook URL format if provided', () => {
      const validation = validateAgentSettings({
        url: 'https://test.com',
        webhookUrl: 'not-a-valid-url',
      });
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('webhook'))).toBe(true);
    });

    it('validates notification email format if provided', () => {
      const validation = validateAgentSettings({
        url: 'https://test.com',
        notificationEmail: 'not-an-email',
      });
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('email'))).toBe(true);
    });

    it('accepts valid email format', () => {
      const validation = validateAgentSettings({
        url: 'https://test.com',
        notificationEmail: 'test@example.com',
      });
      
      // Should not have email error (may have other errors due to missing fields)
      expect(validation.errors.some(e => e.includes('email'))).toBe(false);
    });
  });

  // ===== MERGE WITH DEFAULTS TESTS =====
  
  describe('mergeWithDefaults', () => {
    it('applies defaults for missing optional fields', () => {
      const userSettings = {
        name: 'Test Agent',
        summary: 'Test summary',
      };
      
      const merged = mergeWithDefaults(userSettings, 'https://test.com', 'sales');
      
      expect(merged.tone).toBe(AGENT_SETTINGS_DEFAULTS.tone);
      expect(merged.temperature).toBe(AGENT_SETTINGS_DEFAULTS.temperature);
      expect(merged.maxTokens).toBe(AGENT_SETTINGS_DEFAULTS.maxTokens);
    });

    it('preserves user-provided values over defaults', () => {
      const userSettings = {
        name: 'Test Agent',
        summary: 'Test summary',
        tone: 'casual',
        temperature: 0.9,
      };
      
      const merged = mergeWithDefaults(userSettings, 'https://test.com', 'sales');
      
      expect(merged.tone).toBe('casual');
      expect(merged.temperature).toBe(0.9);
    });

    it('ensures required fields are never undefined', () => {
      const userSettings = {};
      
      const merged = mergeWithDefaults(userSettings, 'https://test.com', 'support');
      
      expect(merged.name).toBeDefined();
      expect(merged.summary).toBeDefined();
      expect(merged.url).toBeDefined();
      expect(merged.role).toBeDefined();
      expect(merged.persona).toBeDefined();
    });
  });

  // ===== ROLE PERSONA TESTS =====
  
  describe('getRolePersona', () => {
    it('returns different personas for different roles', () => {
      const sales = getRolePersona('sales');
      const support = getRolePersona('support');
      const training = getRolePersona('training');
      const custom = getRolePersona('custom');
      
      expect(sales).not.toBe(support);
      expect(support).not.toBe(training);
      expect(training).not.toBe(custom);
    });

    it('returns default persona for unknown role', () => {
      const unknown = getRolePersona('unknown_role');
      
      expect(unknown).toBe('Professional and helpful assistant');
    });

    it('personas match keywords for role', () => {
      expect(getRolePersona('sales')).toContain('sales');
      expect(getRolePersona('support')).toContain('support');
      expect(getRolePersona('training')).toContain('train');
    });
  });

  // ===== UTILITY FUNCTIONS TESTS =====
  
  describe('hasCustomSettings', () => {
    it('returns false for default settings', () => {
      const settings = getDefaultAgentSettings('https://test.com', 'sales');
      settings.name = 'Test';
      settings.summary = 'Test summary';
      
      expect(hasCustomSettings(settings)).toBe(false);
    });

    it('returns true when temperature differs from default', () => {
      const settings = getDefaultAgentSettings('https://test.com', 'sales');
      settings.temperature = 0.9;
      
      expect(hasCustomSettings(settings)).toBe(true);
    });

    it('returns true when custom instructions are set', () => {
      const settings = getDefaultAgentSettings('https://test.com', 'sales');
      settings.customInstructions = 'Custom prompt';
      
      expect(hasCustomSettings(settings)).toBe(true);
    });

    it('returns true when webhook is configured', () => {
      const settings = getDefaultAgentSettings('https://test.com', 'sales');
      settings.webhookUrl = 'https://webhook.com';
      settings.webhookEnabled = true;
      
      expect(hasCustomSettings(settings)).toBe(true);
    });
  });

  describe('getSettingsSummary', () => {
    it('returns default message for default settings', () => {
      const settings = getDefaultAgentSettings('https://test.com', 'sales');
      settings.name = 'Test';
      settings.summary = 'Test summary';
      
      const summary = getSettingsSummary(settings);
      
      expect(summary).toContain('Using default settings');
    });

    it('mentions custom instructions when set', () => {
      const settings = getDefaultAgentSettings('https://test.com', 'sales');
      settings.customInstructions = 'Custom prompt';
      
      const summary = getSettingsSummary(settings);
      
      expect(summary.some(s => s.includes('Custom instructions'))).toBe(true);
    });

    it('mentions webhook when configured', () => {
      const settings = getDefaultAgentSettings('https://test.com', 'sales');
      settings.webhookUrl = 'https://webhook.com';
      settings.webhookEnabled = true;
      
      const summary = getSettingsSummary(settings);
      
      expect(summary.some(s => s.includes('Webhook'))).toBe(true);
    });

    it('mentions CRM integration when configured', () => {
      const settings = getDefaultAgentSettings('https://test.com', 'sales');
      settings.crmType = 'hubspot';
      settings.crmEnabled = true;
      
      const summary = getSettingsSummary(settings);
      
      expect(summary.some(s => s.includes('HUBSPOT'))).toBe(true);
    });
  });

  // ===== CONSTRAINTS CONSISTENCY TESTS =====
  
  describe('Constraints Consistency', () => {
    it('default temperature is within valid range', () => {
      const temp = AGENT_SETTINGS_DEFAULTS.temperature;
      const constraints = AGENT_SETTINGS_CONSTRAINTS.temperature;
      
      expect(temp).toBeGreaterThanOrEqual(constraints.min);
      expect(temp).toBeLessThanOrEqual(constraints.max);
    });

    it('default maxTokens is within valid range', () => {
      const tokens = AGENT_SETTINGS_DEFAULTS.maxTokens;
      const constraints = AGENT_SETTINGS_CONSTRAINTS.maxTokens;
      
      expect(tokens).toBeGreaterThanOrEqual(constraints.min);
      expect(tokens).toBeLessThanOrEqual(constraints.max);
    });

    it('default contextRetrievalCount is within valid range', () => {
      const count = AGENT_SETTINGS_DEFAULTS.contextRetrievalCount;
      const constraints = AGENT_SETTINGS_CONSTRAINTS.contextRetrievalCount;
      
      expect(count).toBeGreaterThanOrEqual(constraints.min);
      expect(count).toBeLessThanOrEqual(constraints.max);
    });

    it('default matchThreshold is within valid range', () => {
      const threshold = AGENT_SETTINGS_DEFAULTS.matchThreshold;
      const constraints = AGENT_SETTINGS_CONSTRAINTS.matchThreshold;
      
      expect(threshold).toBeGreaterThanOrEqual(constraints.min);
      expect(threshold).toBeLessThanOrEqual(constraints.max);
    });

    it('constraint defaults match AGENT_SETTINGS_DEFAULTS', () => {
      expect(AGENT_SETTINGS_CONSTRAINTS.contextRetrievalCount.default)
        .toBe(AGENT_SETTINGS_DEFAULTS.contextRetrievalCount);
      
      expect(AGENT_SETTINGS_CONSTRAINTS.matchThreshold.default)
        .toBe(AGENT_SETTINGS_DEFAULTS.matchThreshold);
      
      expect(AGENT_SETTINGS_CONSTRAINTS.temperature.default)
        .toBe(AGENT_SETTINGS_DEFAULTS.temperature);
      
      expect(AGENT_SETTINGS_CONSTRAINTS.maxTokens.default)
        .toBe(AGENT_SETTINGS_DEFAULTS.maxTokens);
    });
  });
});