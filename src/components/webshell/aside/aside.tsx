import React, {useEffect, useRef, useState} from "react";
import type {DraggableData, DraggableEvent} from 'react-draggable';
import Draggable from 'react-draggable';
import type {TreeDataNode} from 'antd';
import {Button, Form, Input, Modal, Select, Tree} from 'antd';
import {DesktopOutlined, DownOutlined, FolderOutlined} from '@ant-design/icons';
import {Item, Menu, useContextMenu} from "react-contexify";
import History, {HistoryProps} from "../History";
import {SftpProps} from "../SftpTerm";
// const treeData: TreeDataNode[] = [
//     {
//         title: 'parent 1',
//         key: '0-0',
//         icon: <SmileOutlined />,
//         children: [
//             {
//                 title: 'leaf',
//                 key: '0-0-0',
//                 icon: <MehOutlined />,
//             },
//             {
//                 title: 'leaf',
//                 key: '0-0-1',
//                 icon: ({ selected }) => (selected ? <FrownFilled /> : <FrownOutlined />),
//             },
//         ],
//     },
// ];
export interface AsideProps {

    onGenToken: Function;
}
const Aside: React.FunctionComponent<AsideProps> = props => {
    const [disabled, setDisabled] = useState(true);
    const [treeData, setTreeData] = useState<TreeDataNode[]>([]);
    const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
    const draggleRef = useRef<HTMLDivElement>(null);
    const MENU_ID = "tree-menu-id";
    const {show} = useContextMenu({
        id: MENU_ID
    });
    const loadData=async () => {
        const response = await fetch("/template_data/data",{
            method:"post",
            body:JSON.stringify({
                "service": "project.my_env_tree"
            }),
            headers:{
                'Content-Type':"application/json",
                Accept:"application/json"
            }
        })
        const data = await response.json()
        // @ts-ignore
        let result= data.data
        expandKeys=[]
        const handlerNode= (item: {
            icon: JSX.Element;
            children: [];
            key: any; server_ip?: string; title?: any; server_busi_name?: any; server_env_name?: any; server_env_id?: any; server_id?: any })=>{
            item.key = item.server_id?item.server_id:item.server_env_id
            item.title=item.server_id?item.server_ip+"("+item.server_busi_name+")":item.server_env_name
            if(item.children){
                expandKeys.push(item.key)
                item.icon=<FolderOutlined/>
                item.children.forEach(child=>{
                    handlerNode(child)
                })
            }else{
                item.icon=<DesktopOutlined />
            }
        }
        result.forEach((item: {    icon: JSX.Element;children: [];key: any; server_ip?: string; title?: any; server_busi_name?: any; server_env_name?: any; server_env_id?: any; server_id?: any; } )=>{
            handlerNode(item)
            expandKeys.push(item.key)
        })
        setExpandKeys(expandKeys)
        setTreeData(result)

    }
    const getUserList=async(server_id: string)=>{
        const response = await fetch("/template_data/data",{
            method:"post",
            body:JSON.stringify({
                "service": "project.server_os_users_query",
                "server_id": server_id
            }),
            headers:{
                'Content-Type':"application/json",
                Accept:"application/json"
            }
        })
        const data = await response.json()
        setUserList(data.data)
        if(data.data.length>0){
            form.setFieldValue("server_os_users_id",data.data[0].server_os_users_id)
        }else{
            form.setFieldValue("server_os_users_id","")
        }

    }
    const [userList,setUserList]=useState([])
    const onStart = (_event: DraggableEvent, uiData: DraggableData) => {
        const { clientWidth, clientHeight } = window.document.documentElement;
        const targetRect = draggleRef.current?.getBoundingClientRect();
        if (!targetRect) {
            return;
        }
        setBounds({
            left: -targetRect.left + uiData.x,
            right: clientWidth - (targetRect.right - uiData.x),
            top: -targetRect.top + uiData.y,
            bottom: clientHeight - (targetRect.bottom - uiData.y),
        });
    };
    const [lastNode,setLastNode]=useState(null)

    const handlerDblClick=(event: any,data:any)=>{
        if(!data.children){
            form.setFieldValue("server_ip",data.server_ip)
            form.setFieldValue("server_id",data.server_id)
            setLastNode(data)
            setIsModalOpen(true);
            getUserList(data.server_id)
        }

    }
    let [selectedKeys,setSelectedKeys]=useState(['columns0'])
    let [expandKeys,setExpandKeys]=useState([''])
    const onSelect = (keys: any, e: any)=>{
        if(!e.selected){
            setSelectedKeys([e.node.key])
            return
        }
        setSelectedKeys(keys)
    }
    const [isModalOpen, setIsModalOpen] = useState(false);


    const handleOk = () => {
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const onFinish = async (values: any) => {
        setIsModalOpen(false);
        let token = await genToken()
        props.onGenToken(token,lastNode)
    };
    const genToken=async () => {
        let params={
            "service":"webshell.gen_token",
            "server_os_users_id": form.getFieldValue("server_os_users_id")
        }
        const response = await fetch("/template_data/data", {
            method: "post",
            body: JSON.stringify(params),
            headers: {
                'Content-Type': "application/json",
                Accept: "application/json"
            }
        })
        const data = await response.json()
        return data.data

    }

    const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo);
    };

    type FieldType = {
        server_ip?: string;
        server_os_users_id?: string;
        server_id?: string;
    };
    const [form] = Form.useForm();

    useEffect(()=>{
        // if(treeData.length<=0){
            loadData()

        // }

        // console.log("xxx")
    },[props])
    // loadData()
    const onExpand=(expandedKeys: any)=>{

        setExpandKeys(expandedKeys)
    }
    const [lastTreeNode,setTreeLastNode]=useState(null)
    const onRightClick=(data: {
        // @ts-ignore
        event: MouseEvent | TouchEvent | KeyboardEvent | React.MouseEvent<Element, NativeMouseEvent> | React.TouchEvent<Element> | React.KeyboardEvent<Element>;
        node: any; })=>{
        setTreeLastNode(data.node)

        show({
            event: data.event,
        });
    }
    function handlerHistory(){
        // @ts-ignore
        history?.current?.show(lastTreeNode?.server_id,lastTreeNode.title)
    }

    const treeStyle: React.CSSProperties = {
        backgroundColor: '#fafafa',
    };
    const history = useRef<HistoryProps>(null)
    return (
        <>
            <Tree
                style={treeStyle}
                showLine
                showIcon
                defaultExpandAll
                switcherIcon={<DownOutlined />}
                onDoubleClick={handlerDblClick}
                expandAction="doubleClick"
                onSelect={onSelect}
                expandedKeys={expandKeys}
                onExpand={onExpand}
                onRightClick={onRightClick}
                defaultExpandedKeys={selectedKeys}
                defaultSelectedKeys={selectedKeys}
                selectedKeys={selectedKeys}
                treeData={treeData}
            />
            <Menu id={MENU_ID}>
                <Item onClick={handlerHistory}>
                    操作记录
                </Item>
            </Menu>
            <History ref={history}></History>
            <Modal
                footer={null}
                maskClosable={false}
                title={
                    <div
                        style={{
                            padding:'16px 0px 12px 20px',
                            width: '100%',
                            cursor: 'move',
                            background: '#409eff',
                            color:"white",
                            fontWeight:'bold',
                            borderBottom: '1px solid #d7d7d7'
                        }}
                        onMouseOver={() => {
                            if (disabled) {
                                setDisabled(false);
                            }
                        }}
                        onMouseOut={() => {
                            setDisabled(true);
                        }}
                        // fix eslintjsx-a11y/mouse-events-have-key-events
                        // https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/master/docs/rules/mouse-events-have-key-events.md
                        onFocus={() => {}}
                        onBlur={() => {}}
                        // end
                    >
                        在线Shell登陆
                    </div>
                }
                modalRender={(modal) => (
                    <Draggable
                        disabled={disabled}
                        bounds={bounds}
                        nodeRef={draggleRef}
                        onStart={(event, uiData) => onStart(event, uiData)}
                    >
                        <div ref={draggleRef}>{modal}</div>
                    </Draggable>
                )}
                open={isModalOpen} onCancel={handleCancel} >
                <Form
                    name="basic"
                    labelCol={{ span: 4 }}
                    wrapperCol={{ span: 20 }}
                    style={{ maxWidth: 600 }}
                    initialValues={{ remember: true }}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                    form={form}

                >
                    <Form.Item<FieldType>
                        label="服务器"
                        name="server_ip"

                        rules={[{ required: true, message: '请选择服务器！' }]}
                    >
                        <Input readOnly />
                    </Form.Item>

                    <Form.Item<FieldType>
                        label="用户"
                        name="server_os_users_id"
                        rules={[{ required: true, message: '请选择用户' }]}
                    >
                        <Select
                            fieldNames={{label:"user_name",value:"server_os_users_id"}}
                            options={userList}
                        />
                    </Form.Item>

                    <Form.Item wrapperCol={{ offset: 9, span: 6 }}>
                        <Button
                            onClick={onFinish}
                            block
                            type="primary" htmlType="submit">
                            登 陆
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}
export default Aside