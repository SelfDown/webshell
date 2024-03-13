import React, {createRef, useRef, useState} from 'react';
import styles from './ssh.module.scss'
import SSHTerminal, {TerminalProps} from "./SSHTerminal";
import Aside from "./aside/aside"
import './ssh.scss'
import {Button, ConfigProvider, Layout, Tabs,Input,InputRef ,Form} from 'antd';
import zhCN from "antd/lib/locale/zh_CN"
import SftpTerm ,{SftpProps}from "./SftpTerm";
import {Item, Menu, useContextMenu} from "react-contexify";

import "react-contexify/dist/ReactContexify.css";
import {Panel, PanelGroup, PanelResizeHandle,} from "react-resizable-panels";
import CollectHeader from "./header/Header";
const {Header, Footer, Sider, Content} = Layout;
const headerStyle: React.CSSProperties = {
    color: '#fff',
    height: 44,
    paddingInline: 48,
    lineHeight: '44px',
    backgroundColor: '#4096ff',
};

const siderStyle: React.CSSProperties = {
    backgroundColor: '#fafafa',
};

const contentStyle: React.CSSProperties = {
    backgroundColor: 'white',
    position: 'relative',
    height: '100%',
    overflow: "hidden",
    zIndex: 1,
};

const footerStyle: React.CSSProperties = {
    padding: '4px 10px',
    display: "flex",
    alignItems:"center"

};
const footerLabelStyle: React.CSSProperties = {
    width:"80px",
    textAlign:"right",
    paddingRight:'10px'

};

const layoutStyle = {
    height: '100%',
    overflow: 'hidden',

};
const tabStyle = {
    height: '101%',
    overflow: 'hidden',

};

const formStyle = {
    width: '100%',
    marginBottom: '0px',

};

export interface SSHTabs {
    name: "",
    items: []
}

type TargetKey = React.MouseEvent | React.KeyboardEvent | string;
const SSHComponent = () => {

    let timer: string | number | NodeJS.Timeout | undefined

    function getLayout() {
        const splitPos = localStorage.getItem('splitPos')
        let defaultLayout = [];
        if (splitPos) {
            try {
                defaultLayout = JSON.parse(splitPos);
            } catch (e) {

            }

        }
        return defaultLayout
    }

    let defaultLayout = getLayout();
    let timer2: string | number | NodeJS.Timeout | null | undefined=null
    function  onVerticalLayout(size:any){
        if (timer2) {
            clearTimeout(timer2);
        }
        timer2 = setTimeout(() => {
            fitAll()
            // childRef.current.fit()
        }, 100)

    }
    function onLayout(size: any) {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            // setContainerSize(size)
            try {
                localStorage.setItem('splitPos', JSON.stringify(size))
            } catch (e) {

            }


            fitAll()

            // childRef.current.fit()
        }, 100)

    }

    const fitAll = () => {
        for(let i=0;i<tabs.length;i++){
            let {activeKey,items,verticalActiveKey,verticalItems} = tabs[i]
            for(let i=0;i<items.length;i++){
                let item=items[i]
                if(activeKey==item.key){// 找到激活的，调用fit
                    item.ref.current?.fit()
                    break
                }
            }
            for(let i=0;i<verticalItems.length;i++){
                let item=verticalItems[i]
                if(verticalActiveKey==item.key){// 找到激活的，调用fit
                    item.ref.current?.fit()
                    break
                }
            }

        }
    }
    function getItemIndex(key: string,items:[]){
        // @ts-ignore
        return items.findIndex((item)=> key == item.key)
    }
    function getTabItem(key: string,items:[]){
        let index = getItemIndex(key,items)
        return items[index]
    }
    const onTabChange = (key: string, item: any,isVertical:boolean) => {

        if(isVertical){
            item.verticalActiveKey=key
        }else{
            item.activeKey = key
            let tabItem = getTabItem(key,item.items)

            setTimeout(()=>{
                // @ts-ignore
                tabItem.ref.current.fit()
                // @ts-ignore
                tabItem.ref.current.focus()
            },50)


        }

        setGroupTabs([...tabs])
       // setTimeout(()=>{
       //     fitAll()
       // },100)
        // fitAll()
    }
    let l: (React.Ref<TerminalProps> | undefined)[] = []
    for (let i = 0; i < 6; i++) {
        let a = createRef<TerminalProps>()
        l.push(a)
    }
    const insertElement=(arr:[], index:number, element:any)=> {
        // @ts-ignore
        arr.splice(index, 0, element);
        return arr;
    }
    const fixSize = ()=>{
        const size = 100/tabs.length
        tabs.forEach(item=>{
            item.size = size
        })
    }
    const genCopyToken=async(token: string)=> {
        const response = await fetch("/template_data/data", {
            method: "post",
            body: JSON.stringify({
                "service": "webshell.gen_token_from_token",
                "token": token
            }),
            headers: {
                'Content-Type': "application/json",
                Accept: "application/json"
            }
        })
        const data = await response.json()
        return data.data
    }
    const AddGroupTab=async (fromTabIndex:number,fromItem: any)=>{
        let tabIndex =tabs.length
        let position = fromTabIndex+1
        let groupItem = genGroupTab(tabIndex)
        // @ts-ignore
        insertElement(tabs,position,groupItem)
        let token = await genCopyToken(fromItem.token)
        fixSize()
        AddTab(position,token,fromItem.title)
    }
    const AddGroupTabVertical=async (fromTabindex: number, fromItem: any) => {
        let tab = tabs[fromTabindex]
        let j = tab.verticalItems.length + 1
        let key = fromTabindex + 'i_j_vertical' + j
        let token = await genCopyToken(fromItem.token)
        let item = genItem(key, tab, j, token, fromItem.title)
        tab.verticalActiveKey = key
        tab.verticalItems = [...tab.verticalItems, item]
        setGroupTabs([...tabs])
    }
    const genGroupTab=(index:number)=>{
        const st = new Date().getTime()
        return {
            activeKey: "1",
            name: `tab${index}_${st}`,
            size: 100,
            items: [],
            verticalActiveKey: "1",
            verticalItems: []
        }
    }
    const genItem=(key:string,currentTabGroup:any,index: number,token:any,title: string)=>{
        let refTmp = createRef<TerminalProps>()
        let item = {
            label: <div onContextMenu={(e) => displayMenu(e, item, currentTabGroup)}>{title}-{index}</div>,
            key: key,
            title:title,
            token: token,
            path: "./",
            closable: true,
            ref: refTmp,
            children: <SSHTerminal ref={refTmp} token={token}/>,
        }
        return item
    }

    function generateRandomString(length: any) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        return Array.from({ length })
            .reduce((result) => result + characters.charAt(Math.floor(Math.random() * characters.length)), '');
    }
    const AddTab = (tabIndex: number,token:any,title:string) => {
        if (tabs.length < tabIndex+1) {
            tabs.push(genGroupTab(tabIndex))
        }
        let currentTabGroup = tabs[tabIndex]
        let items = currentTabGroup.items
        let index = items.length + 1
        let key = `${tabIndex}i_j${index}`+generateRandomString(8)
        let item = genItem(key,currentTabGroup,index,token,title)
        setTimeout(()=>{
            item.ref.current?.focus()
        },50)
        // @ts-ignore
        currentTabGroup.items = [...items, item]
        currentTabGroup.activeKey = key
        setGroupTabs([...tabs])
    }


    let groupTabs: any[] | (() => any[]) = []
    const MENU_ID = "menu-id";

    let [lastTab,setLastTab] = useState(null)
    let [lastCurrentTabGroup,setLastCurrentTabGroup] = useState(null)

    function displayMenu(e: any, item: any, currentTabGroup: any) {
        // put whatever custom logic you need
        // you can even decide to not display the Menu
        // lastTab = item

        // lastCurrentTabGroup = currentTabGroup
        // console.log(currentTabGroup)



            setLastTab(item)
            setLastCurrentTabGroup(currentTabGroup)

        show({
            event: e,

        });

    }
    const onCollapse=()=>{
        setTimeout(()=>{
            fitAll()
        },100)
    }
    const {show} = useContextMenu({
        id: MENU_ID
    });
    function getGroupIndex(group: { name: any; }) {
        for (let i = 0; i < tabs.length; i++) {
            if (group.name == tabs[i].name) {
                return i
            }
        }
        return -1
    }

    function changePath(path: any){

        if(lastTab){
            // @ts-ignore
            lastTab.path = path
        }

    }
    function FileManage(){

        if(lastTab ){
            // @ts-ignore
            sftp.current?.show(lastTab.token,lastTab.path,lastTab.title)

        }

    }

    const horizontal = 'horizontal'
    const vertical = 'vertical'
    function handleItemClick(direction:string) {
        // @ts-ignore
        let index = getGroupIndex(lastCurrentTabGroup)
        if(direction==horizontal){
            AddGroupTab(index,lastTab)
        }else{
            AddGroupTabVertical(index,lastTab)
        }

    }
    let [token,setToken] = useState(0)
    function AddTabTest(){
        setToken(n=>n+1)
        AddTab(0,token,"test")
    }
    function AddGroupTabTest(){
        AddGroupTab(0,{token:111})
    }
    function AddGroupTabVerticalTest(){
        AddGroupTabVertical(0,{token:111})
    }
    function onEdit(targetKey:any,group:{
        verticalActiveKey: string;
        name: string;
        items:[],verticalItems:[],activeKey:string},position:string){
        if(position=='top'){
            let targetIndex = getItemIndex(targetKey,group.items)
            // @ts-ignore
            group.items = group.items.filter(item=>item.key!=targetKey)
            if(group.activeKey==targetKey){
                const current=group.items[targetIndex === group.items.length ? targetIndex - 1 : targetIndex]
                if(current){
                    // @ts-ignore
                    group.activeKey=current.key
                }else{
                    group.activeKey=""
                }
            }

        }else{
            let targetIndex = getItemIndex(targetKey,group.verticalItems)
            // @ts-ignore
            group.verticalItems = group.verticalItems.filter(item=>item.key!=targetKey)
            if(group.verticalActiveKey==targetKey){
                const current=group.verticalItems[targetIndex === group.verticalItems.length ? targetIndex - 1 : targetIndex]
                if(current){
                    // @ts-ignore
                    group.verticalActiveKey=current.key
                }else{
                    group.verticalActiveKey=""
                }

            }
        }
        if(group.items.length==0 && group.verticalItems.length==0){
            tabs = tabs.filter(item=>item.name != group.name)
        }
        fixSize()
        setGroupTabs([...tabs])

        // console.log(position)
    }

    let [tabs, setGroupTabs] = useState(groupTabs)
    const onGenToken=(token: number,node:any)=>{
        AddTab(0,token,node.title)
    }
    const onPressEnter=(e: any)=>{
       let  value = form.getFieldValue("batchInput")
        form.setFieldValue("batchInput","")
        for(let i=0;i<tabs.length;i++){
            let tab = tabs[i]
            if(tab.activeKey && tab.items.length>0){
                let item = getActiveItem(tab.activeKey,tab.items)
                // @ts-ignore
                item.ref.current.send(value)
            }
            if(tab.verticalActiveKey && tab.verticalItems.length>0){
                let item = getActiveItem(tab.verticalActiveKey,tab.verticalItems)
                // @ts-ignore
                item.ref.current.send(value)
            }
        }
    }
    function getActiveItem(activeKey: string,items :[]){
        for(let i=0;i<items.length;i++){
            // @ts-ignore
            if(items[i].key==activeKey){
                return items[i]
            }
        }
        return null
    }

    type FieldType = {
        batchInput?: string;
    };
    const [form] = Form.useForm();
    const openSftpTest=()=>{
        sftp.current?.show("288542039363031040")
    }

    const sftp = useRef<SftpProps>(null)
    return (
        <>
            <ConfigProvider locale={zhCN}>
                <Layout style={layoutStyle}>
                    <Header style={headerStyle}>
                        <CollectHeader></CollectHeader>
                        {/*COLLECT*/}
                        {/*<div style={rightTool}>*/}
                        {/*    <Button*/}
                        {/*        icon={<LoginOutlined/> }*/}
                        {/*        style={loginBtn}*/}
                        {/*        type="text">登陆</Button>*/}
                        {/*</div>*/}
                    </Header>
                    <Layout>
                        <Sider collapsible
                               onCollapse={onCollapse}
                               collapsedWidth="30px"
                               width="300px"
                               style={siderStyle}>
                            <Aside onGenToken={onGenToken}/>
                        </Sider>
                        <Content style={contentStyle}>

                            {tabs.length > 0 && <PanelGroup direction="horizontal" onLayout={onLayout}>

                                {
                                    tabs.map((item, index) => {
                                        return (

                                            <React.Fragment key={item.name}>
                                                <Panel defaultSize={item.size} id={item.name+'_panel'} order={index}>
                                                    <PanelGroup direction="vertical" id={item.name+"_item"} onLayout={onVerticalLayout}>
                                                        {  item.items.length>0 && <Panel  minSize={15} defaultSize={item.verticalItems.length<=0?100:50} id={item.name+"_item_first"} order={1}>
                                                            <Tabs
                                                                onChange={(key) => onTabChange(key, item,false)}
                                                                style={tabStyle}
                                                                defaultActiveKey="1"
                                                                activeKey={item.activeKey}
                                                                type="editable-card"
                                                                size="small"
                                                                hideAdd
                                                                onEdit={(key)=>onEdit(key,item,'top')}
                                                                items={item.items}
                                                            />
                                                        </Panel>}
                                                        { item.verticalItems.length>0 && <PanelResizeHandle className="Resizer"/>}
                                                        { item.verticalItems.length>0 && <Panel minSize={15} defaultSize={item.items.length<=0?100:50} id={item.name+"_item_second"} order={2}>

                                                            <Tabs
                                                                onChange={(key) => onTabChange(key, item,true)}
                                                                style={tabStyle}
                                                                defaultActiveKey="1"
                                                                activeKey={item.verticalActiveKey}
                                                                type="editable-card"
                                                                size="small"
                                                                hideAdd
                                                                onEdit={(key)=>onEdit(key,item,'bottom')}
                                                                items={item.verticalItems}
                                                            />

                                                        </Panel>}

                                                    </PanelGroup>
                                                </Panel>
                                                { index!=tabs.length-1 && <PanelResizeHandle className="Resizer"/>}

                                            </React.Fragment>
                                        )
                                    })
                                }
                            </PanelGroup>}
                            {tabs.length <= 0 && <div className="content-none">请选择选择服务器节点数据</div>}
                            <Menu id={MENU_ID}>
                                <Item onClick={()=>handleItemClick(horizontal)}>
                                    水平分割
                                </Item>

                                <Item onClick={()=>handleItemClick(vertical)}>
                                    垂直分割
                                </Item>
                                <Item onClick={FileManage}>
                                    文件管理
                                </Item>

                            </Menu>
                            <SftpTerm ref={sftp} onChangePath={changePath}></SftpTerm>
                        </Content>
                    </Layout>
                    <Footer style={footerStyle}>
                       <Form

                           style={formStyle}
                           initialValues={{ remember: true }}
                           form={form}
                           name="basic">
                           <Form.Item<FieldType>
                            label="批量执行"
                            style={formStyle}
                            name="batchInput"
                           >

                                <Input

                                    onPressEnter={onPressEnter}
                                    placeholder="当前激活窗口，回车执行"/>
                            </Form.Item>
                       </Form>
                    </Footer>
                </Layout>
            </ConfigProvider>

        </>
    )

}


export default class SSH extends React.Component<any, any> {
    render() {
        return (
            <div className={styles.home}>
                <SSHComponent></SSHComponent>
            </div>
        );
    }
}