# Oraculum 本地模型权重研究与决策

> 版本：v4.3.0
> 决策：**正式版不加入任何模型权重**
> 日期：2026-09-20

## 一、结论

Oraculum 正式 PWA **不引入**任何 AI 模型权重、推理框架或云端 API。采用"开发期文本蒸馏 + 运行期纯查表确定性组合"方案。

## 二、可参考模型及体积

### Qwen2.5-0.5B-Instruct
- 官方：https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct
- 参数：约 0.49B，支持中文多语言，Apache-2.0
- 原始 safetensors：约 988MB
- ONNX 量化版本（onnx-community）：
  - `q4f16` ≈ **483MB**
  - `quantized` ≈ 512MB
  - `q4` ≈ 786MB

### DeepSeek-R1-Distill-Qwen-1.5B
- 官方：https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B
- 真正的蒸馏模型
- fp 权重约 **3.55GB**，完全不适合手机 PWA

### Tianwen MiniCPM5-1B（社区项目）
- 参考：https://huggingface.co/spaces/liuyd-dev/tianwen
- MiniCPM5-1B + LoRA，58 条 teacher 蒸馏样本
- F16 GGUF 约 2.1GB
- Q4_K_M 约 **700MB**
- 思路可参考，但不代表传统资料权威，也不适合旧 iPhone 默认运行

### SmolLM2-360M-Instruct
- 模型更小，但主要标注英语，不是中文传统文化解释的首选

## 三、正式版不采用的原因

### 1. iPhone 8 / 旧 Safari 兼容性
- Transformers.js 官方明确说明 Safari 的 WebGPU 支持取决于版本，主要是较新的 Safari / iOS
- 旧 iPhone（iPhone 8 及更早）可能完全没有可用 WebGPU
- 回退到 CPU 推理速度极慢，用户体验不可接受

### 2. WebGPU 不稳定或不可用
- WebGPU 在移动端浏览器仍处于早期支持阶段
- 不同浏览器、不同版本的实现差异大
- 无法保证稳定的推理体验

### 3. PWA 首次下载巨大
- 最小可用模型（Qwen2.5-0.5B q4f16）约 483MB
- 加上应用本身，首次加载超过 500MB
- 对移动网络和存储空间都是巨大负担

### 4. 缓存和内存压力
- 483MB+ 模型需要缓存在 PWA Cache Storage 中
- 运行时还需要加载到内存，旧设备可能因内存不足崩溃
- Service Worker 缓存管理复杂度大幅增加

### 5. 当前需求本质是"解释已有结构"
- Oraculum 的核心是确定性排盘 + 结构化解读
- 卦辞、爻辞、小象、评分结果都是**已知的结构化数据**
- 不需要运行时大模型来"生成"解读，只需要把已有结构翻译成现代语言
- 开发期用语言能力生成候选 → 校验 → 固化为静态 JSON，运行期纯查表
- 这比运行时模型更稳定、更轻量、更可复现

## 四、禁止新增的依赖

正式版代码库中**禁止**出现以下任何一项：

- `@huggingface/transformers`
- `WebLLM`
- `onnxruntime-web`（用于模型推理）
- 任何模型权重文件（.gguf / .onnx / .safetensors / .bin）
- 任何 server 端 AI 推理
- 任何外部 AI API 调用
- 任何云端推理服务

## 五、采用的方案：开发期文本蒸馏

```
开发期：
  语言能力根据爻辞 + 小象 + 现有 coreMeaning 生成候选现代释义
  → Schema 校验（字段完整、字数范围、禁词检查）
  → 规则复核（不编造现实事件、不输出确定命运）
  → 固化为静态 JSON

运行期：
  纯查表 + 确定性模板组合
  无网络请求、无模型推理、无随机性
```

所有长辈友好释义写入 `src/local-data/interpretation/elderFriendly*.json`，运行时不请求任何模型。
