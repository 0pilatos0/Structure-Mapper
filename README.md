# JSON Structure Analyzer

A command-line tool that analyzes JSON files and generates a structural representation of their schema. Perfect for understanding the structure of large JSON files or validating JSON data patterns.

## Features

- 🔍 Analyzes any JSON file to determine its structure
- 📊 Handles nested objects and arrays
- 🚀 Fast processing with Bun runtime
- 💡 Smart type inference
- 📝 Detailed progress tracking
- 🎨 Beautiful CLI interface with colors and spinners
- 🔄 Merges array structures intelligently
- 🛡️ Built-in file validation and error handling

## Prerequisites

- [Bun](https://bun.sh) runtime installed on your system

## Installation

1. Clone the repository:

```bash
git clone https://github.com/0pilatos0/Structure-Mapper.git
cd structuremapper
```

2. Install dependencies:

```bash
bun install
```

## Usage

Basic usage:

```bash
bun start -i ./path/to/input.json
```

### Command Line Options

```bash
Options:
  -i, --input    Input JSON file path (required)
  -o, --output   Output file path (default: ./output/structure.json)
  -v, --verbose  Show detailed progress
  -s, --silent   Suppress all output except errors
  -h, --help     Show this help message
```

### Examples

Analyze a JSON file with default output location:

```bash
bun start -i ./data.json
```

Specify custom output location:

```bash
bun start -i ./data.json -o ./custom/output.json
```

Run with verbose logging:

```bash
bun start -i ./data.json -v
```

Run silently (useful for scripts):

```bash
bun start -i ./data.json -s
```

## Output Format

The tool generates a JSON file that represents the structure of your input data. For example:

Input:

```json
{
  "name": "John",
  "age": 30,
  "hobbies": ["reading", "gaming"]
}
```

Output:

```json
{
  "name": "string",
  "age": "number",
  "hobbies": ["string"]
}
```

## Features in Detail

### Type Detection

- Identifies primitive types (string, number, boolean)
- Handles null values
- Detects arrays and their content types
- Maps nested object structures

### Array Handling

- Merges similar structures in arrays
- Handles empty arrays (`"empty[]"`)
- Preserves array depth and nesting

### Safety Features

- Input file validation
- File type checking
- Automatic output directory creation
- Error handling with helpful messages

## Error Handling

The tool provides clear error messages for common issues:

- Invalid JSON format
- File not found
- Unsupported file types
- Permission issues
- Invalid output paths

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this tool in your projects.

## Author

Paul van der Lei - 0pilatos0

## Acknowledgments

Built with:

- [Bun](https://bun.sh) - Fast JavaScript runtime
- [chalk](https://github.com/chalk/chalk) - Terminal string styling
- [ora](https://github.com/sindresorhus/ora) - Elegant terminal spinners
