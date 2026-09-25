export const restorationNavigation = [
  { label: '修复总览', to: '/' },
  { label: '批次档案', to: '/batches' },
  { label: '任务清单', to: '/tasks' },
]

export const restorationHero = {
  title: '古籍虫蛀修复批次板',
  description:
    '聚焦修复批次、控湿参数和文献归档风险，适合作为修复工作室内部业务系统的前端原型。',
  backlogLabel: '待处理批次',
  backlogValue: '12 册',
  note: '高湿季节前优先清理虫道扩散页。',
}

export const restorationBatches = [
  {
    code: 'A-03',
    title: '明抄本县志残卷',
    pages: '17-29',
    risk: 'high',
    status: '补纸前',
    note: '虫道集中在装订线外沿。',
  },
  {
    code: 'B-11',
    title: '碑帖拓片册页',
    pages: '5-14',
    risk: 'medium',
    status: '控湿中',
    note: '需先降湿 48 小时，再进入纤维加固。',
  },
  {
    code: 'C-02',
    title: '戏曲抄本散页',
    pages: '1-9',
    risk: 'low',
    status: '归档前',
    note: '边角缺损明显，建议先做透明托裱。',
  },
]

export const restorationEnvironment = [
  {
    label: '相对湿度',
    value: '52%',
    note: '控制线 50% - 55%',
  },
  {
    label: '纸浆补配',
    value: '2 批',
    note: '桑皮纤维待过滤',
  },
  {
    label: '紫外检查',
    value: '4 页',
    note: '夜间统一复核霉斑残留',
  },
]

export const restorationSteps = [
  '拍照建档并标注虫蛀起止页。',
  '低压吸附除尘，保留边角碎纤维。',
  '喷雾回软后局部补纸，不做整页过度清洗。',
  '平整定型 8 小时后转入无酸盒暂存。',
]

// 角色：lead 修复负责人（有变更资格）、restorer 修复师、viewer 观看（不承接任务）
// active=false 表示已停用，停用人员不能再被写回任务负责人
export const restorationStaff = [
  { id: 'S-01', name: '韩澈', role: 'lead', active: true },
  { id: 'S-02', name: '陆宁', role: 'restorer', active: true },
  { id: 'S-03', name: '周恬', role: 'restorer', active: true },
  { id: 'S-04', name: '沈观', role: 'viewer', active: true },
  { id: 'S-05', name: '江杳', role: 'restorer', active: false },
]

// ownerHistory 保留历任负责人；closedAt 非空表示已封存的历史任务
export const restorationTasks = [
  {
    id: 'T-01',
    title: '明抄本县志残卷',
    stage: '补纸前',
    risk: 'high',
    ownerId: 'S-01',
    ownerName: '韩澈',
    note: '虫道贯穿标题栏，需先固色。',
    version: 1,
    closedAt: null,
    ownerHistory: [
      {
        ownerId: 'S-01',
        ownerName: '韩澈',
        changedAt: '2026-09-01',
        changedByName: '系统建档',
        reason: '初次派工',
      },
    ],
  },
  {
    id: 'T-02',
    title: '碑帖拓片册页',
    stage: '控湿中',
    risk: 'medium',
    ownerId: 'S-02',
    ownerName: '陆宁',
    note: '边缘卷曲，可延后压平。',
    version: 1,
    closedAt: null,
    ownerHistory: [
      {
        ownerId: 'S-02',
        ownerName: '陆宁',
        changedAt: '2026-09-01',
        changedByName: '系统建档',
        reason: '初次派工',
      },
    ],
  },
  {
    id: 'T-03',
    title: '戏曲抄本散页',
    stage: '归档前',
    risk: 'low',
    ownerId: 'S-03',
    ownerName: '周恬',
    note: '等待封套尺寸确认。',
    version: 1,
    closedAt: null,
    ownerHistory: [
      {
        ownerId: 'S-03',
        ownerName: '周恬',
        changedAt: '2026-09-02',
        changedByName: '系统建档',
        reason: '初次派工',
      },
    ],
  },
  {
    id: 'T-04',
    title: '线装医书零本',
    stage: '已归档',
    risk: 'low',
    ownerId: 'S-02',
    ownerName: '陆宁',
    note: '整托完成后已入无酸盒封存。',
    version: 2,
    closedAt: '2026-09-05',
    ownerHistory: [
      {
        ownerId: 'S-05',
        ownerName: '江杳',
        changedAt: '2026-08-02',
        changedByName: '系统建档',
        reason: '初次派工',
      },
      {
        ownerId: 'S-02',
        ownerName: '陆宁',
        changedAt: '2026-08-21',
        changedByName: '韩澈',
        reason: '江杳调岗，交接压平工序',
      },
    ],
  },
]
