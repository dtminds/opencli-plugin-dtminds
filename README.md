# opencli-plugin-dtminds

> 🔌 An [OpenCLI](https://github.com/jackwener/opencli) plugin — dtminds能力开放插件

## Install

```bash
# Via opencli plugin manager
opencli plugin install github:dtminds/opencli-plugin-dtminds
```

## Update

```bash
opencli plugin update dtminds
```

## Uninstall

```bash
opencli plugin uninstall dtminds
```

## Usage

```bash
# 搜索租户信息
opencli dtminds search --companyAlias 一头牛

# 获取跟进记录列表
opencli dtminds follow-record --uid 40

# 获取销售合同列表
opencli dtminds crm-contract --uid 40

# 获取销售订单列表
opencli dtminds crm-order --uid 40
```

## How It Works

This is a **TS adapter plugin** that internally calls multiple `opencli dtminds` commands.

## Plugin Layout

```
opencli-plugin-dtminds/
├── package.json     # peerDependency on @jackwener/opencli
├── seach.ts     # TS adapter
└── README.md
```

## Requirements

- OpenCLI v1.0.0+

## License

MIT