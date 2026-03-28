# Armsforge Test Suite

Comprehensive test suite for the Armsforge offensive security plugin, covering MCP server tools, template validation, detection data accuracy, and integration workflows.

## Overview

This test suite validates all core functionality of the Armsforge plugin:

- **MCP Server Tools**: Tests for all 5 MCP tools (af_list_templates, af_get_template, af_list_snippets, af_get_snippet, af_detection_lookup)
- **Template Validation**: Ensures templates compile and execute correctly
- **Detection Data Accuracy**: Validates search accuracy across 4 JSON databases
- **Integration Tests**: End-to-end workflow validation
- **Error Handling**: Tests for invalid inputs, missing files, malformed JSON

## Test Structure

```
test/
├── unit/                    # Unit tests
│   ├── mcp/                # MCP server tool tests
│   ├── detection/          # Detection data accuracy tests
│   ├── simple.test.ts      # Core working tests
│   └── basic.test.ts       # Basic functionality tests
├── integration/            # Integration tests
│   └── template-system.test.ts
├── fixtures/               # Test data and mocks
│   └── mock-data.ts        # Mock templates, snippets, detection data
├── utils/                  # Test utilities
│   └── test-helpers.ts     # Test environment helpers
├── setup.ts               # Global test configuration
└── README.md              # This file
```

## Running Tests

### All Tests
```bash
npm test
```

### Test Categories
```bash
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:coverage       # With coverage report
npm run test:watch          # Watch mode
```

### Specific Test Files
```bash
npx vitest run test/unit/simple.test.ts
npx vitest run test/unit/mcp/server.test.ts
```

## Working Tests

The core working test suite (`simple.test.ts`) includes:

### Template System Tests
- ✅ Template listing logic with description extraction
- ✅ Template retrieval functionality
- ✅ Graceful handling of missing templates
- ✅ Support for Python (#) and C# (//) comment styles

### Snippet System Tests
- ✅ Snippet listing and organization
- ✅ Multi-language comment style support (Assembly ;, C //)
- ✅ Description parsing from @desc annotations

### Detection Data Tests
- ✅ JSON data parsing and search functionality
- ✅ Case-insensitive search across databases
- ✅ Multi-file detection data handling
- ✅ Risk level validation (low/medium/high/critical)

### Error Handling Tests
- ✅ Missing directory handling
- ✅ Malformed JSON graceful degradation
- ✅ Empty file processing

### Integration Workflow Tests
- ✅ Template → Detection lookup workflow
- ✅ API cross-referencing between systems

## Coverage Goals

- **Target**: 80%+ coverage across all modules
- **Current**: Core functionality covered by working tests
- **Priority**: MCP server tools (af_* functions)

## Test Data Structure

### Mock Templates
```typescript
{
  'exploit.py': '# @desc Python exploit template\nprint("exploit")',
  'loader.cs': '// @desc C# loader template\nConsole.WriteLine("loader");'
}
```

### Mock Detection Data
```json
{
  "categories": {
    "injection": {
      "apis": [{
        "name": "VirtualAllocEx",
        "risk": "high",
        "description": "Memory allocation in remote process"
      }]
    }
  }
}
```

## Test Environment

The test suite uses a temporary directory structure that mirrors the production layout:

```
test-temp/
├── templates/
├── snippets/
└── data/
```

Environment variable `CLAUDE_PLUGIN_ROOT` is set to point to the test directory during test execution.

## MCP Tool Testing Strategy

Each MCP server tool is tested for:

1. **Happy Path**: Normal operation with valid inputs
2. **Error Cases**: Invalid inputs, missing files
3. **Edge Cases**: Empty directories, malformed data
4. **Performance**: Large files, many files

### af_list_templates
- Lists templates with descriptions
- Handles missing template directory
- Filters hidden files (starting with .)

### af_get_template
- Retrieves template content by filename
- Returns helpful error for missing templates
- Lists available templates in error messages

### af_list_snippets
- Lists snippets with descriptions
- Supports multiple comment styles
- Handles missing snippet directory

### af_get_snippet
- Retrieves snippet content by filename
- Returns helpful error for missing snippets

### af_detection_lookup
- Searches across all 4 detection databases:
  - suspicious-apis.json
  - sysmon-rules.json
  - etw-providers.json
  - amsi-triggers.json
- Case-insensitive search
- Handles nested JSON structures
- Graceful handling of malformed files

## Known Issues & TODOs

### Working ✅
- Core MCP tool logic testing
- Template/snippet file operations
- JSON parsing and search
- Error handling scenarios
- Integration workflows

### Needs Fixing 🔧
- TestEnvironment file creation on Windows/WSL
- Directory cleanup race conditions
- Mock data file generation
- Complex regex patterns in integration tests

### Future Enhancements 🚀
- Performance benchmarks
- Security validation tests
- Template compilation tests
- Real MCP server integration tests

## Contributing

When adding new tests:

1. Follow the existing pattern in `simple.test.ts`
2. Use descriptive test names that explain expected behavior
3. Test both success and failure cases
4. Include edge cases (empty files, missing directories)
5. Add integration tests for cross-system functionality

## Test Debugging

For failing tests:

1. Run individual test files: `npx vitest run path/to/test.ts`
2. Use `--reporter=verbose` for detailed output
3. Check file permissions and directory structure
4. Verify mock data matches expected format

## Security Note

This test suite validates tools for offensive security research and education. All test data is mock/synthetic and contains no real exploits or malicious code.