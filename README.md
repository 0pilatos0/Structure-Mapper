# JSON Structure Analyzer (Structure Mapper)

Analyze any JSON input and produce a concise structural schema. Great for exploring unknown APIs, reverse‑engineering logs, or quickly summarizing large JSON dumps.

## ✨ Highlights

- 🔍 Infers structure (object fields, nested depth, array element shapes)
- � Works with files or STDIN streaming (`cat data.json | structuremapper --stdin`)
- �️ Print directly to stdout (`--print`) or write to a file (default)
- 📊 Complexity metrics (depth, unique fields, compression ratio)
- ⚡ Fast: built on the Bun runtime
- 🔄 Merges heterogeneous array item structures intelligently
- 🛡️ Validation + clear error messages
- 🎯 Minimal, zero-config usage (just point at a JSON file)

## 🚀 Install / Run

You need [Bun](https://bun.sh) installed.

Clone + install dependencies:

```bash
git clone https://github.com/0pilatos0/Structure-Mapper.git
cd Structure-Mapper
bun install
```

Run directly with Bun (development):

```bash
bun start -i ./data.json
```

Or (after publishing) you could run via npx:

```bash
npx structuremapper data.json --print
```

## 🧪 Quick Examples

Basic file analysis (writes `./output/structure.json`):

```bash
structuremapper data.json
```

Custom output path:

```bash
structuremapper data.json -o schema/output.json
```

Print to stdout only (no file written):

```bash
structuremapper data.json --print
```

Stream from stdin:

```bash
curl -s https://api.example.com/data | structuremapper --stdin --print
```

Verbose progress (parsing + traversal updates):

```bash
structuremapper data.json -v
```

Silent mode (machine friendly):

```bash
structuremapper data.json -s --print > schema.json
```

Disable colors (CI logs):

```bash
structuremapper data.json --no-color
```

Show version:

```bash
structuremapper --version
```

## 🧾 CLI Reference

```
Usage:
  structuremapper [options] <file>
  structuremapper --stdin --print < data.json

Options:
  -i, --input        Input JSON file path (positional argument also works)
  -o, --output       Output file path (default: ./output/structure.json)
  -p, --print        Print structure to stdout instead of writing a file
      --stdin        Read JSON from STDIN
      --no-color     Disable colored output
      --version      Show version number
  -v, --verbose      Show detailed progress logs
  -s, --silent       Suppress all non-error output
  -h, --help         Show help
```

Behavior rules:

- If `--print` is used, no file is written unless you also pass `-o` (not required).
- One of: a file path (positional / `-i`) OR `--stdin` must be provided.
- Colors can be disabled for scripting/CI with `--no-color`.

## 🧱 Output Structure

Given this input:

```json
{
  "name": "John",
  "age": 30,
  "hobbies": ["reading", "gaming"],
  "profile": { "active": true, "tags": [] }
}
```

You get:

```json
{
  "name": "string",
  "age": "number",
  "hobbies": ["string"],
  "profile": {
    "active": "boolean",
    "tags": ["empty[]"]
  }
}
```

Notes:

- Empty arrays are represented as `"empty[]"` so you can distinguish them from populated arrays.
- Arrays of objects are merged: all discovered fields across items are combined into one representative object.

## 🧠 How It Works

1. Loads JSON (file or STDIN)
2. Parses eagerly (shows parse timing in verbose mode)
3. Recursively traverses values, recording:
   - Field names (unique paths)
   - Type labels (primitive | object | merged array element shape)
4. Arrays: gathers shapes of each element then merges into a single normalized schema.
5. Reports metrics (depth, unique field count, compression ratio vs. original file size, elapsed time).

## 🔎 Metrics Explained

- Max Depth – Deepest nested object/array level.
- Unique Fields – Count of unique dotted field paths.
- Compression – `(structureSize / originalSize) * 100` – a rough indicator of structure conciseness.

## ⚠️ Error Cases

- Invalid JSON syntax
- Missing input path / missing `--stdin`
- Unsupported file extension (only `.json` currently)
- File not found / permission denied

All exit with non‑zero status for easy scripting.

## 🛠 Development

```bash
bun install
bun start -i examples/sample.json -v
```

## 🤝 Contributing

PRs welcome! Some ideas:

- Streaming / incremental parsing for huge JSON
- Add type frequency stats
- Support more input formats (NDJSON, YAML)
- Option to emit TypeScript interface stubs

## 📄 License

MIT – use it freely.

## 👤 Author

Paul van der Lei (@0pilatos0)

## 🙏 Acknowledgments

- [Bun](https://bun.sh)
- [chalk](https://github.com/chalk/chalk)
- [ora](https://github.com/sindresorhus/ora)
