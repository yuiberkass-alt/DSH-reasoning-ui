# Q版鲸娘推理滑块

DeepSeek Harness (DSH) 桌面端原生界面插件，适配 `0.2.0-rc.2`。

点击输入框中的模型名称，即可拖动 Q 版小鲸娘调整推理等级。

## 功能

- 从 DSH 当前模型目录读取真实推理档位；DeepSeek-V41-Flash 显示 Off / Low / High / Max。
- 蓝色进度填充到当前档位，右侧保留白色浅底；明确的 Max 档启用紫色星光。
- Q 版人物包含待机、眨眼、起跑、奔跑、收步动画，向左拖动时转向。
- 支持拖动、点击档位、方向键和 Home / End。拖动时预览，松手提交一次。
- 保留模型选择与恢复默认等级功能。
- 通过 DSH 的模型目录服务保存选择，对后续请求生效。
- 保存失败时显示错误并恢复已有选择；支持系统减少动态效果偏好。

## 安装与使用

[下载 v1.0.0 安装包](https://github.com/yuiberkass-alt/DSH-reasoning-ui/releases/download/v1.0.0/dsh-chibi-slider-v1.0.0.zip)

ZIP SHA-256：`4633aa70fe02e176bfb0509b0119cb45ab55079d0983b8ca94363d4181f93db3`

1. 下载项目包并解压到固定目录，保留其中的 `package.json`、`client.js` 等文件。
2. 在 DSH 中打开 **插件 → 添加插件**，输入解压目录的绝对路径。
3. 安装并启用 **Q版鲸娘推理滑块**。
4. 点击会话输入框中的模型名称，拖动人物或点击档位。

本地目录安装可能链接到原目录，请保留该目录。更新文件后完全退出并重新打开 DSH，以加载新的客户端代码。
停用插件即可恢复原生模型菜单；插件不修改 DSH 安装包。

## 开发

无需安装第三方依赖。使用 Node.js：

```sh
node build.mjs
node --check client.js
node --test tests/plugin.test.mjs
```

源码位于 `src/client.template.js`。`build.mjs` 将四张透明 PNG 动作条嵌入 `client.js`，运行时不向外部图片服务发请求。
每张动作条包含四个等宽单元：`assets/idle.png`、`start.png`、`run.png`、`stop.png`。

插件通过 `conversation.input.model` 插槽贡献控件，并显式声明模型目录和会话远程服务依赖。
该接口随 DSH 更新可能变化，本项目未验证其他桌面版本。

## 素材与隐私

这是非官方同人界面插件，与 DeepSeek 官方没有隶属关系。人物素材由 AI 根据 Q 版鲸娘参考设计生成。
发布包只包含插件源代码、构建产物、生成的透明动作素材和说明，不包含用户参考原图、截图、聊天记录、DSH 配置、账号信息或密钥。

本地逻辑及插槽测试已通过；已安装到 DSH。自动化对完整拖动动画、所有模型及错误恢复的实机验证尚未全部完成。
