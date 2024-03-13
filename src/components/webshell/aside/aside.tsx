import React, {useEffect, useRef, useState,useMemo} from "react";
import type {DraggableData, DraggableEvent} from 'react-draggable';
import Draggable from 'react-draggable';
import type {TreeDataNode} from 'antd';
import {Button, Form, Input, Modal, Select, Tree, TreeSelect, Divider, message} from 'antd';
import {
    HistoryOutlined,
    DesktopOutlined,
    DownOutlined,
    FolderOutlined,
    SearchOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    LoginOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import {Item, Menu, useContextMenu} from "react-contexify";
import History, {HistoryProps} from "../History";

export interface AsideProps {

    onGenToken: Function;
}
const nodeTypeList=[{"label":"环境","value":"1"},{label:"服务器",value:"2"}]
const Aside: React.FunctionComponent<AsideProps> = props => {
    const [disabled, setDisabled] = useState(true);
    const [treeData, setTreeData] = useState<TreeDataNode[]>([]);
    const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
    const draggleRef = useRef<HTMLDivElement>(null);
    const MENU_ID = "tree-menu-id";
    const {show} = useContextMenu({
        id: MENU_ID
    });
    const searchTool:React.CSSProperties={
        padding:"4px 10px",
        display:"flex",
        alignItems:"center"
    }
    const addBtn:React.CSSProperties={
        width:"28px",
        height:"28px",
        lineHeight:"1",
        marginRight:"4px",
        cursor:"pointer"
    }

    let [ dataList,setDataList]  =useState<{ key: React.Key; title: string }[]>([]);

    const getParentKey = (key: React.Key, tree: TreeDataNode[]): React.Key => {
        let parentKey: React.Key;
        for (let i = 0; i < tree.length; i++) {
            const node = tree[i];
            if (node.children) {
                if (node.children.some((item) => item.key === key)) {
                    parentKey = node.key;
                } else if (getParentKey(key, node.children)) {
                    parentKey = getParentKey(key, node.children);
                }
            }
        }
        return parentKey!;
    };
    const generateList = (data: TreeDataNode[],dataList:{ key: React.Key; title: string }[]) => {
        for (let i = 0; i < data.length; i++) {
            const node = data[i];
            const { key,title } = node;
            dataList.push({ key, title: title as string });
            if (node.children) {
                generateList(node.children,dataList);
            }
        }
    };
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
        let  expandKeys: any[] | ((prevState: React.Key[]) => React.Key[])=[]
        const handlerNode= (item: {
            value: any;
            icon: JSX.Element;
            children: [];
            key: any; server_ip?: string; title?: any; server_busi_name?: any; server_env_name?: any; server_env_id?: any; server_id?: any })=>{
            item.key = item.server_id?item.server_id:item.server_env_id
            item.title=item.server_id?item.server_ip+"("+item.server_busi_name+")":item.server_env_name

            if(item.children){
                //@ts-ignore
                expandKeys.push(item.key)
                item.icon=<FolderOutlined/>
                item.children.forEach(child=>{
                    handlerNode(child)
                })
                item.value = item.server_env_id
                
            }else{
                item.icon=<DesktopOutlined />
            }
        }
        result.forEach((item: {   value:string, icon: JSX.Element;children: [];key: any; server_ip?: string; title?: any; server_busi_name?: any; server_env_name?: any; server_env_id?: any; server_id?: any; } )=>{
            handlerNode(item)
            //@ts-ignore
            expandKeys.push(item.key)
        })
        // setTimeout(()=>{
        //     expandedNode("1")
        // },10)
        setTreeData(result)
        dataList=[]
        generateList(result,dataList);
        setDataList(dataList)
        setExpandedKeys(expandKeys)


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

        return data.data

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
            getUserList(data.server_id).then(data=>{
                setUserList(data)
                if(data.length>0){
                    form.setFieldValue("server_os_users_id",data[0].server_os_users_id)
                }else{
                    form.setFieldValue("server_os_users_id","")
                }
            })

        }

    }
    let [selectedKeys,setSelectedKeys]=useState(['columns0'])
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
    const onSelect = (keys: any, e: any)=>{
        if(!e.selected){
            setSelectedKeys([e.node.key])
            return
        }
        setSelectedKeys(keys)
    }
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isServerOpen, setServerOpen] = useState(false);


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
    const deleteNode=async () => {
        //@ts-ignore
        const{server_env_id,server_id} = lastTreeNode
        let params;
        if (server_id) {
            params = {
                "service": "project.server_delete",
                "server_id_list": [server_id]
            }
        } else {
            params = {
                "service": "project.server_env_delete",
                "server_env_id_list": [server_env_id]
            }
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
    type NodeType={
        node_type?: string
        server_env_name?: string
        server_env_code?: string
        parent_id?: string
        server_env_id?:string
        server_busi_name?:string
        server_ip?:string
        root_username?:string
        root_password?:string
        normal_username?:string
        normal_password?:string
    }
    const [form] = Form.useForm();
    const [form2] = Form.useForm();

    useEffect(()=>{
        // if(treeData.length<=0){
            loadData()

        // }

        // console.log("xxx")
    },[props])
    // loadData()
    const onExpand=(expandedKeys: any)=>{

        setExpandedKeys(expandedKeys);
        setAutoExpandParent(false);
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
        flex:"1",
        overflowY:"auto",
        height:"100%"

    };
    const contentStyle:React.CSSProperties={
        height:"100%",
        display:"flex",
        flexDirection:"column"
    }
    const iconStyle: React.CSSProperties={
        marginRight:"10px",

    }
    const history = useRef<HistoryProps>(null)
    const [autoExpandParent, setAutoExpandParent] = useState(true);
    const [searchValue, setSearchValue] = useState('');
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        expandedNode(value)
        setSearchValue(value);


    };

    const saveEnvServerData=async()=>{
        let params = form2.getFieldsValue()

        if(op=='add'){// 新增
            if(nodeType=='1'){
                params["service"]="project.add_current_project_env"
            }else {// 添加服务器
                params["service"] = "project.server_add"
            }
        }else{// 修改
            //@ts-ignore
            let {server_id,server_env_id,sys_project_id}=lastTreeNode
            if(nodeType=='1'){//修改环境
                params["service"]="project.server_env_update"
                params["server_env_id"] = server_env_id
                params["sys_project_id"] = sys_project_id
            }else {// 修改服务器
                params["service"] = "project.server_modify"
                params["server_id"]=server_id
            }
        }
        // 环境
        if(nodeType=='1'){
            //params["service"]="project.add_current_project_env"
        }else{// 添加服务器
            // params["service"]="project.server_add"
            params["users_table"]=[{
                    "ossoft_user_group_id": "os_users_root",
                    "user_name": params.root_username,
                    "user_pwd": params.root_password
            }]
            if(params.normal_username ){
                params["users_table"].push({
                    "ossoft_user_group_id": "os_users_normal",
                    "user_name": params.normal_username,
                    "user_pwd": params.normal_password
                })
            }

        }
        const response = await fetch("/template_data/data",{
            method:"post",
            body:JSON.stringify(params),
            headers:{
                'Content-Type':"application/json",
                Accept:"application/json"
            }
        })
        const data = await response.json()
        if(data.code=='0'){
            setServerOpen(false)
            loadData()
        }else{
            message.error(data.msg)
            return
        }

    }

    const onTreeSelectChange=(newValue: string)=>{
        form.setFieldValue("parent_id",newValue)
        setParentId(newValue)
    }
    function expandedNode(value:string){
        const newExpandedKeys = dataList
            .map((item) => {
                if (item.title.indexOf(value) > -1) {
                    return getParentKey(item.key, treeData);
                }
                return null;
            })
            .filter((item, i, self): item is React.Key => !!(item && self.indexOf(item) === i));
        // 往上面再取一层
        let pparent:React.Key[]=[]
        newExpandedKeys.forEach(key=>{
            let p  = getParentKey(key, treeData);
            if(newExpandedKeys.indexOf(p)<0){
                pparent.push(p)
            }
        })
        setExpandedKeys([...newExpandedKeys,...pparent]);
    }
    const getEnvTreeList=(data: TreeDataNode[])=>{
        let dataList: TreeDataNode[] = []
        for(let i=0;i<data.length;i++){
            let item = data[i]
            //@ts-ignore
            if(item.server_id){
                continue
            }
            dataList.push(item)
            if(item.children){
                // @ts-ignore
                item.children = getEnvTreeList(item.children)
            }
        }
        return dataList
    }
    const treeEnvSelect=useMemo(()=>{

        return getEnvTreeList(JSON.parse(JSON.stringify(treeData)))
    },[searchValue,treeData])
    const treeDataMemo = useMemo(() => {
        const loop = (data: TreeDataNode[]): TreeDataNode[] =>
            data.map((item) => {
                const strTitle = item.title as string;
                const index = strTitle.indexOf(searchValue);
                const beforeStr = strTitle.substring(0, index);
                const afterStr = strTitle.slice(index + searchValue.length);
                const title =
                    index > -1 ? (
                        <span>
              {beforeStr}
                            <span className="site-tree-search-value">{searchValue}</span>
                            {afterStr}
            </span>
                    ) : (
                        <span>{strTitle}</span>
                    );
                if (item.children) {

                    return {
                        icon:item.icon,
                        //@ts-ignore
                        server_env_id:item.server_env_id,
                        //@ts-ignore
                        server_env_name: item.server_env_name,
                        //@ts-ignore
                        server_env_code: item.server_env_code,
                        //@ts-ignore
                        order_id: item.order_id,
                        //@ts-ignore
                        parent_id: item.parent_id,
                        // @ts-ignore
                        sys_project_id: item.sys_project_id,
                        title,
                        key: item.key,
                        children: loop(item.children)
                    };
                }


                return {
                    title,
                    icon:item.icon,
                    key: item.key,
                    //@ts-ignore
                    server_id: item.server_id,
                    //@ts-ignore
                    server_ip: item.server_ip,
                    //@ts-ignore
                    server_env_id: item.server_env_id,
                    //@ts-ignore
                    server_busi_name: item.server_busi_name
                };
            });

        return loop(treeData);
    }, [searchValue,treeData]);
    function AddNode(){
        setServerOpen(true)
        form2.resetFields()
        form2.setFieldValue("node_type","1")
        setNodeType("1")
        setOp("add")
    }
    const [op,setOp] = useState("")
    function AddNodeFromMenu(){
        setOp("add")
        setServerOpen(true)
        form2.resetFields()
        // @ts-ignore
        let {server_env_id}= lastTreeNode
        form2.setFieldValue("parent_id",server_env_id)
        form2.setFieldValue("server_env_id",server_env_id)
        form2.setFieldValue("node_type","2")
        setNodeType("2")
    }
    function RemoveNodeFromMenu(){
        const { confirm } = Modal;
        // @ts-ignore
        let item = lastTreeNode
        // @ts-ignore
        let title=item.server_id?item.server_ip+"("+item.server_busi_name+")":item.server_env_name
        //@ts-ignore
        if(item?.children?.length>0){
            message.error(title+" 节点下面存在数据，请删除后再删除该节点")
            return
        }
        confirm({
            icon: <ExclamationCircleOutlined />,
            content: `确认删除所选【${title}】节点吗`,
            onOk() {
                deleteNode().then(()=>{
                    loadData()
                })
            },
            onCancel() {
            },
        });

    }
    function EditNodeFromMenu(){
        setOp("edit")

        setServerOpen(true)
        form2.resetFields()
        // @ts-ignore
        let {sys_project_id,server_busi_name,server_ip,parent_id,server_env_id,server_id,server_env_name,server_env_code,order_id}= lastTreeNode
        // 设置环境ID
        form2.setFieldValue("server_env_id",server_env_id)
        if(server_id){// 服务器
            setNodeType("2")
            form2.setFieldValue("node_type","2")

            form2.setFieldValue("server_ip",server_ip)
            form2.setFieldValue("server_busi_name",server_busi_name)
            getUserList(server_id).then(userList=>{
                for(let i=0;i<userList.length;i++){
                    let user = userList[i]
                    if(user.ossoft_user_group_id=='os_users_root'){
                        form2.setFieldValue("root_username",user.user_name)
                        form2.setFieldValue("root_password",user.user_pwd)
                    }else if(user.ossoft_user_group_id=='os_users_normal'){
                        form2.setFieldValue("normal_username",user.user_name)
                        form2.setFieldValue("normal_password",user.user_pwd)
                    }
                }
            })
        }else{//设置环境信息
            setNodeType("1")
            form2.setFieldValue("node_type","1")
            form2.setFieldValue("server_env_name",server_env_name)
            form2.setFieldValue("server_env_code",server_env_code)
            form2.setFieldValue("order_id",order_id)
            form2.setFieldValue("parent_id",parent_id)
            form2.setFieldValue("sys_project_id",sys_project_id)
        }
    }
    const[parentId,setParentId]=useState("")
    const changeNodeType=(value:string)=>{
        setNodeType(value)
    }
    const [nodeType,setNodeType]=useState("")
    const infoStyle:React.CSSProperties={
        marginBottom: '10px'
    }
    const onCreateNode=()=>{
        saveEnvServerData()
    }
    const connectTest=()=>{
        console.log("xx")
    }
    const loginStyle:React.CSSProperties={
        cursor:"pointer"
    }
    return (
        <div style={contentStyle}>
            <div style={searchTool}>
                <Button
                    onClick={AddNode}
                    type="primary"
                    style={addBtn}
                    icon={<PlusOutlined />}

                />
                <Input
                    onChange={onChange}
                    placeholder="请输入节点名称" suffix={<SearchOutlined />}/>
            </div>


            <Tree
                style={treeStyle}
                showLine
                showIcon
                defaultExpandAll
                switcherIcon={<DownOutlined />}
                onDoubleClick={handlerDblClick}
                expandAction="doubleClick"
                onSelect={onSelect}
                expandedKeys={expandedKeys}
                autoExpandParent={autoExpandParent}
                onExpand={onExpand}
                onRightClick={onRightClick}
                defaultExpandedKeys={selectedKeys}
                defaultSelectedKeys={selectedKeys}
                selectedKeys={selectedKeys}
                treeData={treeDataMemo}
            />
            <Menu id={MENU_ID}>

                <Item onClick={AddNodeFromMenu}>
                    <PlusOutlined style={iconStyle} />新增记录
                </Item>
                <Item onClick={EditNodeFromMenu}>
                    <EditOutlined style={iconStyle} /> 修改记录
                </Item>
                <Item onClick={RemoveNodeFromMenu} >
                    <DeleteOutlined style={iconStyle} /> 删除记录
                </Item>
                <Item onClick={handlerHistory}>
                    <HistoryOutlined style={iconStyle} /> 操作记录
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
                        onStart={(event: any, uiData: any) => onStart(event, uiData)}
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
                    onFinish={onFinish}
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

                            block
                            type="primary" htmlType="submit">
                            登 陆
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
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
                        {op=='add'?'新增节点':'修改节点'}
                    </div>
                }
                modalRender={(modal) => (
                    <Draggable
                        disabled={disabled}
                        bounds={bounds}
                        nodeRef={draggleRef}
                        onStart={(event: any, uiData: any) => onStart(event, uiData)}
                    >
                        <div ref={draggleRef}>{modal}</div>
                    </Draggable>
                )}
                open={isServerOpen}
                onCancel={()=>{setServerOpen(false)}} >
                <Form
                    name="basic2"
                    labelCol={{ span: 4 }}
                    wrapperCol={{ span: 20 }}
                    style={{ maxWidth: 600 }}
                    initialValues={{ remember: true }}
                    autoComplete="off"
                    form={form2}
                    onFinish={onCreateNode}

                >


                    <Form.Item<NodeType>
                        label="类型"
                        name="node_type"
                        rules={[{ required: true, message: '请选择类型' }]}
                    >
                        <Select
                           disabled={op!=='add'}
                            options={nodeTypeList}
                            onChange={changeNodeType}

                        />
                    </Form.Item>
                    { nodeType =='1' &&<>

                        <Form.Item<NodeType>
                            label="上级"
                            name="parent_id"


                        >
                            <TreeSelect
                                showSearch
                                style={{ width: '100%' }}
                                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                                placeholder="请选择节点,不选默认根目录"
                                allowClear
                                value={parentId}
                                treeDefaultExpandAll
                                onChange={onTreeSelectChange}
                                treeData={treeEnvSelect}
                            />
                        </Form.Item>

                        <Form.Item<NodeType>
                            label="环境名称"
                            name="server_env_name"
                            rules={[{ required: true, message: '请选择类型' }]}
                        >
                           <Input/>
                        </Form.Item>
                        <Form.Item<NodeType>
                            label="环境编码"
                            name="server_env_code"
                            rules={[{ required: true, message: '请选择环境名称' }]}
                        >
                           <Input/>
                        </Form.Item>
                        <Form.Item
                            label="排序号"
                            name="order_id"
                        >
                            <Input />
                        </Form.Item>
                    </>}
                    { nodeType =='2' &&<>

                        <Form.Item<NodeType>
                            label="所属环境"
                            name="server_env_id"


                        >
                            <TreeSelect
                                showSearch
                                style={{ width: '100%' }}
                                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                                placeholder="请选择节点,不选默认根目录"
                                allowClear
                                value={parentId}
                                treeDefaultExpandAll
                                onChange={onTreeSelectChange}
                                treeData={treeEnvSelect}
                            />
                        </Form.Item>
                        <Form.Item<NodeType>
                            label="资源名称"
                            name="server_busi_name"
                            rules={[{ required: true, message: '请输入资源名称' }]}
                        >
                            <Input/>
                        </Form.Item>

                        <Form.Item<NodeType>
                            label="服务器IP"
                            name="server_ip"
                            rules={[{ required: true, message: '输入服务器IP' }]}
                        >
                            <Input/>
                        </Form.Item>
                        <Divider />
                        <div style={infoStyle}>管理员账号/密码</div>
                        <Form.Item<NodeType>
                            label="账号："
                            name="root_username"
                            rules={[{ required: true, message: '请输入管理员账号' }]}
                        >
                            <Input/>
                        </Form.Item>
                        <Form.Item<NodeType>
                            label="密码："
                            name="root_password"
                            rules={[{ required: true, message: '请输入管理员密码' }]}
                        >
                            <Input.Password addonAfter={<LoginOutlined title="连接测试" style={loginStyle}/>}  />


                        </Form.Item>
                        <Divider />
                        <div style={infoStyle}>普通账号/密码</div>
                        <Form.Item<NodeType>
                            label="账号："
                            name="normal_username"

                        >
                            <Input/>
                        </Form.Item>
                        <Form.Item<NodeType>

                            label="密码："
                            name="normal_password"

                        >
                            <Input.Password addonAfter={<LoginOutlined title="连接测试" style={loginStyle} />}  />
                        </Form.Item>
                        </>
                    }

                    <Form.Item wrapperCol={{ offset: 9, span: 6 }}>
                        <Button

                            block
                            type="primary" htmlType="submit">
                            {op=='add'?'创 建':'保 存'}
                        </Button>

                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
export default Aside