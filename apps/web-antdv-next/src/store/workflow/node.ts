import { defineStore } from 'pinia'
import { NodeType } from '#/views/workflow/designer/interfaces';
import type { IBranchNode, IRouteNode, ISnapshot, IWorkFlowNode } from '#/views/workflow/designer/interfaces';
import type { IMaterialUIs, INodeMaterial } from '#/views/workflow/designer/interfaces/material';
import { defaultMaterials } from '#/views/workflow/designer/floweditor/defaultmaterials';
import { computed, markRaw } from "vue";
import { materialUis } from '#/views/workflow/designer/floweditor/materialuis';
import { createUuid } from '#/views/workflow/designer/utils/create-uuid';

interface INodeStore {
    node: IWorkFlowNode,
    materials: INodeMaterial[],
    materialUis: IMaterialUIs,
    undoList: ISnapshot[],
    redoList: ISnapshot[],
    validated: boolean,
    selectedNode?: string
}

const useNodeStore = defineStore('node', {
    state: (): INodeStore => {
        return {
            node: {
                id: "start",
                nodeType: NodeType.start,
            },
            materials: markRaw(defaultMaterials),
            materialUis: markRaw(materialUis),
            redoList: [],
            undoList: [],
            validated: false,
            selectedNode: undefined
        }
    },
    getters: {
        startNode: (state) => computed(() => state.node),

    },
    actions: {

        setSelectNode(nodeId: string) {
            this.selectedNode = nodeId
        },
        setStartNode(node: IWorkFlowNode) {
            this.node = node;
        },
        getMaterialByNodeType(nodeType: NodeType): INodeMaterial | undefined {
            return this.materials.find(material => material.defaultConfig?.nodeType === nodeType)
        },
        addNode(parentId: string, newNode: IWorkFlowNode) {
            this.backup();
            this.recursiveAdd(this.node, parentId, newNode);

        },
        addCondition(node: IRouteNode, condition: IBranchNode) {
            this.backup();
            node.conditionNodeList = [...node.conditionNodeList, condition];
        },
        transConditionOneStepToLeft(node: IRouteNode, index: number) {
            if (index > 0) {
                this.backup();
                const newConditions = [...node.conditionNodeList]
                const left = newConditions[index - 1]!
                newConditions[index - 1] = newConditions[index]!
                newConditions[index] = left
                node.conditionNodeList = newConditions
            }
        },
        transConditionOneStepToRight(node: IRouteNode, index: number) {
            const newConditions = [...node.conditionNodeList]
            if (index < newConditions.length - 1) {
                this.backup();
                const right = newConditions[index + 1]!
                newConditions[index + 1] = newConditions[index]!
                newConditions[index] = right
                node.conditionNodeList = newConditions
            }
        },
        cloneCondition(node: IRouteNode, condition: IBranchNode) {
            const newCondition = JSON.parse(JSON.stringify(condition))
            newCondition.id = createUuid()
            newCondition.name = `${condition.name} - 复制`
            const index = node.conditionNodeList.indexOf(condition)
            const newList = [...node.conditionNodeList]
            newList.splice(index + 1, 0, newCondition)
            node.conditionNodeList = newList
        },
        deleteNode(id: string) {
            this.backup();
            this.node = this.recursiveDelete(this.node, id)!;
        },
        deleteCondition(parentNode: IRouteNode, index: IBranchNode) {
            if (parentNode.conditionNodeList.length <= 2) {
                this.deleteNode(parentNode.id)
                return
            }
            this.backup();
            parentNode.conditionNodeList = parentNode.conditionNodeList.filter((item) => item.id !== index.id)
        },
        recursiveAdd(state: IWorkFlowNode, parentId: string, newNode: IWorkFlowNode) {
            // 如果当前节点是目标父节点，则在它下面插入新节点
            if (state.id === parentId) {
                // 若当前节点没有子节点，直接挂载
                if (!state.childNode) {
                    state.childNode = newNode;
                } else {
                    // 若已有子节点，新节点插入到当前节点和原子节点之间
                    newNode.childNode = state.childNode;
                    state.childNode = newNode;
                }
                return;
            }

            // 递归处理主链子节点
            if (state.childNode) {
                this.recursiveAdd(state.childNode, parentId, newNode);
            }
            const routeNode = state as IRouteNode
            // 路由节点需要继续递归处理每个条件分支节点
            if (routeNode.nodeType === NodeType.route && routeNode.conditionNodeList) {
                routeNode.conditionNodeList.forEach(conditionNode => {
                    this.recursiveAdd(conditionNode, parentId, newNode);
                });
            }

        },
        recursiveDelete(node: IWorkFlowNode, id: string): IWorkFlowNode | undefined {
            if (node.id === id) {
                return node.childNode;
            }

            if (node.childNode) {
                node.childNode = this.recursiveDelete(node.childNode, id);
            }

            if (node.nodeType === NodeType.route) {
                const routeNode = node as IRouteNode;
                routeNode.conditionNodeList = routeNode.conditionNodeList
                    .map(conditionNode => this.recursiveDelete(conditionNode, id))
                    .filter(conditionNode => conditionNode !== null) as IBranchNode[];
            }

            return node;
        },
        undo() {

            if (this.undoList.length === 0) {
                console.error("No element in undo list");
                return;
            }

            const snapshot = this.undoList.pop();

            this.redoList.push(JSON.parse(JSON.stringify({
                startNode: this.node,
                validated: snapshot?.validated,
            })));

            if (snapshot) {
                this.node = snapshot.startNode;
            }
        },
        redo() {
            if (this.redoList.length === 0) {
                console.error("No element in redo list");
                return;
            }

            const snapshot = this.redoList.pop();

            this.undoList.push({
                startNode: this.node,
                validated: snapshot?.validated,
            });

            if (snapshot) {
                this.node = snapshot.startNode;
            }
        },
        backup() {
            this.undoList.push(JSON.parse(JSON.stringify({
                startNode: this.node,
                validated: this.validated,
            })));

            this.redoList = [];

        },
        getNode(nodeId: string, parentNode?: IWorkFlowNode): IWorkFlowNode | undefined {
            const startNode = parentNode || this.node
            if (startNode?.id === nodeId && nodeId) {
                return startNode
            }
            if (startNode?.childNode) {
                const foundNode = this.getNode(nodeId, startNode?.childNode)
                if (foundNode) {
                    return foundNode
                }
            }
            if (startNode?.nodeType === NodeType.route) {
                for (const conditionNode of (startNode as IRouteNode).conditionNodeList) {
                    const foundNode = this.getNode(nodeId, conditionNode)
                    if (foundNode) {
                        return foundNode
                    }
                }
            }
            return undefined
        }
    },
})

export default useNodeStore
