"use strict";

const terms = {
  recurrent: { en: "recurrent", zh: "循环", domain: "CS / AI", defn: "按时间步顺序传递隐藏状态的网络结构（如 RNN、LSTM）。", common: ["循环", "递归"], recommended: "循环", context: "神经网络架构", note: "易与 recursive（递归）混淆，二者机制不同：recurrent 指时序循环，recursive 指结构递归。" },
  ldep: { en: "long-range dependencies", zh: "长距离依赖", domain: "CS / AI", defn: "序列中相距较远的元素之间存在的语义或语法关联。", common: ["长距离依赖", "长程依赖"], recommended: "长距离依赖", context: "序列建模" },
  token: { en: "token", zh: "词元", domain: "CS / AI", defn: "文本被切分后的最小处理单位，可为词、子词或字符。", common: ["词元", "标记", "令牌"], recommended: "词元", context: "自然语言处理", note: "编程语境下 token 多译“令牌”，本文为 NLP 语境，全文统一采用“词元”。" },
  embed: { en: "representations", zh: "表示", domain: "CS / AI", defn: "模型为输入学习到的向量化特征。", common: ["表示", "表征"], recommended: "表示", context: "表示学习" },
  selfattn: { en: "self-attention", zh: "自注意力", domain: "CS / AI", defn: "序列内部各元素相互计算注意力权重的机制，用于捕捉任意位置间的依赖。", common: ["自注意力", "内部注意力"], recommended: "自注意力", context: "深度学习 / 序列建模" },
  bench: { en: "machine-translation benchmarks", zh: "机器翻译基准", domain: "CS / AI", defn: "用于评测机器翻译质量的标准数据集与指标（如 WMT、BLEU）。", common: ["机器翻译基准", "机器翻译评测集"], recommended: "机器翻译基准", context: "模型评测" },
  biomarker: { en: "biomarker", zh: "生物标志物", domain: "医学 / 生物", defn: "可客观测量并反映生理或病理状态的指标。", common: ["生物标志物", "生物标记物"], recommended: "生物标志物", context: "临床 / 分子生物" },
  invitro: { en: "in vitro", zh: "体外", domain: "医学 / 生物", defn: "在生物体外（如试管、培养皿）中进行的实验。", common: ["体外", "离体"], recommended: "体外", context: "实验方法", note: "对应 in vivo（体内）；二者常成对出现，注意区分。" },
  apoptosis: { en: "apoptosis", zh: "细胞凋亡", domain: "医学 / 生物", defn: "由基因调控的程序性细胞死亡过程。", common: ["凋亡", "细胞凋亡", "程序性死亡"], recommended: "细胞凋亡", context: "细胞生物学" },
  calibration: { en: "calibration", zh: "标定", domain: "工程 / 物理", defn: "通过已知标准对仪器测量值进行校正的过程。", common: ["标定", "校准", "校正"], recommended: "标定", context: "测量 / 仪器", note: "calibration 在测量语境多译“标定 / 校准”，依设备与行业习惯而定。" },
  linfit: { en: "linear fit", zh: "线性拟合", domain: "工程 / 物理", defn: "用直线模型拟合数据点以描述其线性关系。", common: ["线性拟合", "线性回归拟合"], recommended: "线性拟合", context: "数据分析" }
};

const docs = {
  d1: {
    title: "Attention-Based Sequence Modeling",
    source: "arXiv · cs.CL · 2024",
    type: "pdf",
    domain: "计算机 / 人工智能",
    conf: 96,
    pages: 14,
    terms: ["selfattn", "token", "recurrent", "ldep", "embed", "bench"],
    paras: [
      {
        o: [{ t: "Recent neural sequence models rely heavily on " }, { t: "recurrent", k: "recurrent" }, { t: " architectures to capture " }, { t: "long-range dependencies", k: "ldep" }, { t: " between " }, { t: "tokens", k: "token" }, { t: "." }],
        z: [{ t: "近年来的神经序列模型在很大程度上依赖" }, { t: "循环", k: "recurrent" }, { t: "结构来捕捉" }, { t: "词元", k: "token" }, { t: "之间的" }, { t: "长距离依赖", k: "ldep" }, { t: "关系。" }]
      },
      {
        o: [{ t: "We propose a network that dispenses with " }, { t: "recurrence", k: "recurrent" }, { t: " entirely and instead computes " }, { t: "representations", k: "embed" }, { t: " through a " }, { t: "self-attention", k: "selfattn" }, { t: " mechanism." }],
        z: [{ t: "本文提出一种完全摒弃" }, { t: "循环", k: "recurrent" }, { t: "的网络，转而通过" }, { t: "自注意力", k: "selfattn" }, { t: "机制来计算" }, { t: "表示", k: "embed" }, { t: "。" }]
      },
      {
        o: [{ t: "Each " }, { t: "token", k: "token" }, { t: " attends to every other " }, { t: "token", k: "token" }, { t: " in the sequence, allowing the model to learn contextual relationships in parallel." }],
        z: [{ t: "序列中的每个" }, { t: "词元", k: "token" }, { t: "都会关注其他所有" }, { t: "词元", k: "token" }, { t: "，使模型能够并行地学习上下文关系。" }]
      },
      {
        o: [{ t: "On standard " }, { t: "machine-translation benchmarks", k: "bench" }, { t: ", the approach attains competitive accuracy while substantially reducing training time." }],
        z: [{ t: "在标准的" }, { t: "机器翻译基准", k: "bench" }, { t: "上，该方法在大幅缩短训练时间的同时，取得了具有竞争力的准确率。" }]
      }
    ]
  },
  d2: {
    title: "A Novel Biomarker for Tumor Progression",
    source: "Nature Communications · 2023",
    type: "pdf",
    domain: "医学 / 生物",
    conf: 93,
    pages: 9,
    terms: ["biomarker", "invitro", "apoptosis"],
    paras: [
      {
        o: [{ t: "The " }, { t: "biomarker", k: "biomarker" }, { t: " exhibited elevated expression in tumor tissue compared with adjacent normal samples." }],
        z: [{ t: "与癌旁正常组织相比，该" }, { t: "生物标志物", k: "biomarker" }, { t: "在肿瘤组织中呈现出升高的表达。" }]
      },
      {
        o: [{ t: "In vitro", k: "invitro" }, { t: " assays further confirmed that the compound induced " }, { t: "apoptosis", k: "apoptosis" }, { t: " in a dose-dependent manner." }],
        z: [{ t: "体外", k: "invitro" }, { t: "实验进一步证实，该化合物以剂量依赖的方式诱导细胞" }, { t: "凋亡", k: "apoptosis" }, { t: "。" }]
      }
    ]
  },
  d3: {
    title: "Fig.3 截图 · 热成像系统标定",
    source: "图片 · PNG · 1920×1080",
    type: "image",
    domain: "工程 / 物理",
    conf: 91,
    pages: 1,
    terms: ["calibration", "linfit"],
    paras: [],
    ocr: {
      o: [{ t: "Figure 3. " }, { t: "Calibration", k: "calibration" }, { t: " curve of the thermal imaging sensor across the operating temperature range. The dashed line denotes the " }, { t: "linear fit", k: "linfit" }, { t: " (R² = 0.998)." }],
      z: [{ t: "图 3. 热成像传感器在工作温度范围内的" }, { t: "标定", k: "calibration" }, { t: "曲线。虚线表示" }, { t: "线性拟合", k: "linfit" }, { t: "（R² = 0.998）。" }]
    }
  }
};

const library = ["d1", "d2", "d3"];

const placeholders = [
  { title: "On the Convergence of Gradient Methods", domain: "数学" },
  { title: "Structural Analysis of Composite Beams", domain: "工程 / 物理" }
];

module.exports = {
  docs,
  library,
  placeholders,
  terms
};
