import React, {forwardRef, useImperativeHandle, useRef, useState,} from "react";
import type {DraggableData, DraggableEvent} from 'react-draggable';
import Draggable from 'react-draggable';
import {Button, Input, Modal, Form, Table, message, Popconfirm, Pagination} from 'antd';
import {
    SearchOutlined,
    CaretRightOutlined,
    FolderOutlined,
    FileOutlined,
} from '@ant-design/icons';
import {AgGridReact} from 'ag-grid-react'; // React Grid Logic
import "ag-grid-community/styles/ag-grid.css"; // Core CSS
// import "ag-grid-community/styles/ag-theme-quartz.css"; // Theme
import "ag-grid-community/styles/ag-theme-balham.css"
import "./sftp.css"
import type { PaginationProps } from 'antd';
import HistoryTerm, {HistoryTermProps} from "./HistoryTerm";

export interface HistoryProps {
    server_id: string
    show: Function
}

const formItemInputStyle = {
    width: '400px',
    marginBottom: '10px',
};
const pageStyle = {
    marginTop:"10px",
    textAlign:"center"
};


const History: React.ForwardRefRenderFunction<HistoryProps, any> = (props, ref) => {

    const [disabled, setDisabled] = useState(true);
    const [bounds, setBounds] = useState({left: 0, top: 0, bottom: 0, right: 0});
    const draggleRef = useRef<HTMLDivElement>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const handleCancel = () => {
        setIsModalOpen(false);
    };
    useImperativeHandle(ref, () => ({
        show(server_id: string, title: string) {
            show(server_id, title)
        },
        server_id: props.server_id,
    }), [props.server_id])
    let [formData,setFormData]=useState({page:1,size:20,search:""})
    let [count,setCount]=useState(0)
    const [title, setTitle] = useState("")
    const show = (server_id: string, title: string) => {
        setIsModalOpen(true)
        form.setFieldValue("server_id", server_id)
        setTitle(title)
        getDataList()
    }
    const onChange: PaginationProps['onChange'] = (pageNumber,pageSize) => {
        formData.page=pageNumber
        setFormData(formData)
        getDataList()
    };
    const onShowSizeChange: PaginationProps['onShowSizeChange'] = (current,pageSize) => {
        formData.page=1
        formData.size=pageSize
        setFormData(formData)
        getDataList()

    };

    const getDataList = async () => {

        const response = await fetch("/template_data/data", {
            method: "post",
            body: JSON.stringify({
                "service": "webshell.webshell_token_query",
                "server_id": form.getFieldValue("server_id"),
                "search": form.getFieldValue("search"),
                "page": formData.page,
                "size":formData.size
            }),
            headers: {
                'Content-Type': "application/json",
                Accept: "application/json"
            }
        })


        const data = await response.json()
        if (!data.success) {
            message.error(data.msg)
            return
        }
        let dataList = data.data
        setCount(data.count)
        setRowData(dataList)
    }
    const onStart = (_event: DraggableEvent, uiData: DraggableData) => {
        const {clientWidth, clientHeight} = window.document.documentElement;
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

    type FieldType = {
        search?: string;


    };
    const [form] = Form.useForm();

    // Row Data: The data to be displayed.
    const [rowData, setRowData] = useState([]);
    const openFolder = (data: { name: string; }) => {
        let path = form.getFieldValue("lastPath")

        if (data.name == "..") {
            let tmp = path.split("/")
            tmp = tmp.filter((item: any) => item)
            tmp.pop()
            path = "/" + tmp.join("/")
        } else {
            if (path.lastIndexOf("/") == path.length - 1) {
                path += data.name
            } else {
                path += "/" + data.name
            }


        }
        form.setFieldValue("path", path)
        getDataList()
    }
    const showHistoryTerm= (token: any,title:any)=>{
        historyTerm?.current?.show(token,title)
    }

    const OperationType = (props: any) => (

        <React.Fragment>
            <Button
                type="text"
                onClick={()=>showHistoryTerm(props.data.token,props.data.create_user_name+"-"+props.data.server_ip+" ("+props.data.create_time+") 耗时："+getTimeDiff( props.data.create_time,props.data.close_time))}
                icon={<CaretRightOutlined />} size="small">
                回放
            </Button>

        </React.Fragment>
    )
    function getTimeDiff(create_time:string,close_time:string){
        if(!close_time && create_time){
            return ""
        }
        let dateBegin = new Date(create_time.replace(/-/g, "/"))
        let dateEnd = new Date(close_time.replace(/-/g, "/"))
        let dateDiff = dateEnd.getTime() - dateBegin.getTime()
        let leave1=dateDiff%(24*3600*1000) //计算天数后剩余的毫秒数
        let leave2=leave1%(3600*1000) //计算小时数后剩余的毫秒数
        let minutes=Math.floor(leave2/(60*1000))//计算相差分钟数
        if (minutes<=0){
            let seconds = Math.floor(leave2/(1000))
            return seconds+"s"
        }
        return  minutes+"min"
    }
    const timeDiff=(param: { data: any; })=>{

        return getTimeDiff( param.data.create_time,param.data.close_time)


    }
    // Column Definitions: Defines & controls grid columns.
    const [colDefs, setColDefs] = useState([
        {
            field: "server_busi_name",
            headerName: "名称",
            width: 120,
            flex: 1,
        },
        {
            field: "server_ip",
            headerName: "IP",
            width: 160
        },
        {
            field: "create_user_name",
            headerName: "操作用户",
            width: 100
        },
        {
            field: "user_name",
            headerName: "登陆用户",
            width: 100
        },
        {field: "create_time", headerName: "开始时间", width: 160},
        {field: "close_time", headerName: "结束时间", width: 160},
        {
            field: "",
            headerName: "耗时",
            valueFormatter:timeDiff,
            width: 120},
        {
            field: "",
            headerName: "操作",
            width: 120,
            cellRenderer: OperationType
        },
    ]);



    const showTotal: PaginationProps['showTotal'] = (total) => `共 ${total} 记录`;
    const historyTerm=useRef<HistoryTermProps>(null)
    return (
        <Modal
            footer={null}
            maskClosable={false}
            wrapClassName="history-dialog"
            width="60%"
            title={
                <div
                    style={{
                        padding: '16px 0px 12px 20px',
                        width: '100%',
                        cursor: 'move',
                        background: '#409eff',
                        color: "white",
                        fontWeight: 'bold',
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
                    onFocus={() => {
                    }}
                    onBlur={() => {
                    }}
                    // end
                >
                    {title}-操作记录
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
            open={isModalOpen} onCancel={handleCancel}>
            <div>
                <Form

                    layout="inline"
                    autoComplete="off"
                    form={form}
                >
                    <Form.Item<FieldType>
                        label="搜索"
                        name="search"
                        style={formItemInputStyle}>
                        <Input onPressEnter={getDataList}></Input>
                    </Form.Item>
                    <Form.Item>
                        <Button icon={<SearchOutlined/>} onClick={getDataList}>搜索</Button>
                    </Form.Item>
                </Form>

                <div className="ag-theme-balham" style={{height: 500, width: "100%"}}>

                    <AgGridReact

                        rowData={rowData}
                        /* @ts-ignore */
                        columnDefs={colDefs}/>
                </div>


                <Pagination
                    /* @ts-ignore */
                    style={pageStyle}
                    showQuickJumper
                    pageSize={formData.size}
                    defaultCurrent={formData.page}
                    total={count}
                    showTotal={showTotal}
                    onShowSizeChange={onShowSizeChange}
                    onChange={onChange} />
                <HistoryTerm ref={historyTerm}></HistoryTerm>

            </div>
        </Modal>
    )
}
export default forwardRef(History);