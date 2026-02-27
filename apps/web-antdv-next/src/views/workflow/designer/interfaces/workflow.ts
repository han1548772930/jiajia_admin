export enum NodeType {
    // 开始节点
    start = "start",
    // 审批节点
    approver = "approver",
    // 抄送节点
    notifier = "notifier",
    // 办理节点
    audit = "audit",
    // 路由节点（包含条件分支）
    route = "route",
    // 条件分支节点
    condition = "condition",
}
export interface IPosition {
    x: number,
    y: number,
    scrollLeft: number,
    scrollTop: number
}
export interface ISnapshot {
    // 开始节点
    startNode: IWorkFlowNode,
    // 是否已校验
    validated?: boolean,
}
export enum SelectRangeEnum {
    // 所有人
    all = 1,
    // 指定人员
    user = 2,
    // 指定角色
    role = 3,
    // 发起人
    starter = 4,
    // 制单人
    originator = 5,
    // 上级主管
    supervisor = 6,

}


export enum ExamineModeEnum {
    // 1.依次审批 2.会签 3.或签
    // 依次审批
    sequence = 1,
    // 会签
    countersign = 2,
    // 或签
    sign = 3,

}

export enum NodeUserTypeEnum {
    // 指定人员
    user = 1,
    // 指定角色
    role = 2,
    // 发起人
    starter = 3,
}

// 节点类型：0.发起 1.审批 2.抄送 3.条件 4.路由 99.流程结束
export enum NodeTypeEnum {
    // 发起
    starter = 0,
    // 审批
    approver = 1,
    // 抄送
    notifier = 2,
    // 条件
    condition = 3,
    // 路由
    route = 4,
    // 流程结束
    end = 99,
}

export interface NodeUsersList {
    targetId: number
    type: number
}

// 流程节点
export interface IWorkFlowNode<Config = unknown> {

    id: string
    // 名称
    name?: string
    // 节点类型；string 预留给自定义节点
    nodeType: NodeType
    // 描述
    desc?: string
    type?: NodeTypeEnum
    // 子节点
    childNode?: IWorkFlowNode
    selectRange?: SelectRangeEnum
    nodeUsers?: NodeUsersList[]
    examineMode?: ExamineModeEnum
    remark?: string
    // 扩展配置
    config?: Config,
    nodeContent?: string
    autoPass?: number
    isEmail?: number
    emailSubject?: string
    emailBody?: string
}


// 路由根节点，下面包含多个条件分支节点
export interface IRouteNode extends IWorkFlowNode {
    // 条件分支节点列表
    conditionNodeList: IBranchNode[]
}

// 条件分支节点
export interface IBranchNode extends IWorkFlowNode {
    // 条件表达式；后续可考虑放入 config 并通过泛型扩展
    //flowNodeConditionVOList?: IExpression[]
}

// 审批流程定义，表示一张审批流图
export interface IWorkflow {
    // 审批流程 ID
    flowId: string;
    // 审批流程名称
    name?: string;
    // 开始节点
    startNode: IWorkFlowNode;
}
