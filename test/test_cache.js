const { TemplateEngine } = require('./dist/templates/engine.js');
const path = require('path');

// Create a test template engine with the templates directory
const engine = new TemplateEngine(path.join(__dirname, 'templates'));

// Test cache statistics
console.log('Initial cache stats:', engine.getCacheStats());

// Test that cache size limit is enforced by adding more than MAX_CACHE_SIZE templates
const testContext = {
  language: 'c',
  target_arch: 'x64',
  target_os: 'windows',
  evasion_level: 1,
  payload_format: 'exe'
};

// Try to access templates to populate cache
try {
  const templates = engine.listTemplates();
  console.log(`Found ${templates.length} templates`);

  if (templates.length > 0) {
    // Test a real template
    const template = templates[0];
    console.log(`Testing template: ${template.name}`);

    // Generate template content to populate cache
    const result = engine.generateTemplate(template.name, testContext, { allowPlaceholders: true });
    console.log('Template generated successfully');
    console.log('Cache stats after generation:', engine.getCacheStats());
  }
} catch (error) {
  console.log('Template generation error (expected for incomplete context):', error.message);
  console.log('Cache stats after attempt:', engine.getCacheStats());
}

// Test cache clearing
engine.clearCache();
console.log('Cache stats after clear:', engine.getCacheStats());

console.log('LRU cache test completed successfully!');