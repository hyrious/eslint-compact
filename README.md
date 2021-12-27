## @hyrious/eslint-compact

Find the minimal representation of your favorite eslint config.

**Usage**

```bash
$ pnpm i
$ node index.js [...extends] target
```

**Example**

```bash
$ node index.js eslint:recommended @npmcli/eslint-config
{
  "root": true,
  "extends": ["eslint:recommended"],
  "plugins": ["node"],
  "rules": {
    ...
  }
}
```

## License

MIT @ [hyrious](https://github.com/hyrious)
