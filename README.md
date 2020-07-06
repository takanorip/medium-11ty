# medium-11ty

A command line tool to convert articles exported from Medium to markdown for 11ty.

Usage

```
$ npx medium-11ty index.js --input InputPath --output OutputPath [...options]
```

## Options

### --layout [layoutPath]
11ty layout path. Default is `layout/blog.njk`.

### --tagName [eleventyTagName]
11ty tag name. Default is `blog`.
