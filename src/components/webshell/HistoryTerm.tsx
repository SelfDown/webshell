import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState,} from "react";
import type {DraggableData, DraggableEvent} from 'react-draggable';
import Draggable from 'react-draggable';
import {Button, Input, Modal, Form, Table, message, Popconfirm, Pagination, Progress, Select} from 'antd';
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
import SSHTerminal, {TerminalProps} from "./SSHTerminal";
export interface HistoryTermProps {
    token: number
    show: Function
}


const dialogStyle : React.CSSProperties= {
    marginTop:"-80px"
};
const dialogFooterStyle : React.CSSProperties= {
    marginTop:"10px",
    display:"flex"
};

const HistoryTerm: React.ForwardRefRenderFunction<HistoryTermProps, any> = (props, ref) => {

    const [disabled, setDisabled] = useState(true);
    const [bounds, setBounds] = useState({left: 0, top: 0, bottom: 0, right: 0});
    const draggleRef = useRef<HTMLDivElement>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const handleCancel = () => {
        setIsModalOpen(false);
    };
    useImperativeHandle(ref, () => ({
        show(token: string, title: string) {
            show(token, title)
        },
        token: props.token,
    }), [props.server_id])
    const [title, setTitle] = useState("")
    const show = (token: string, title: string) => {
        setIsModalOpen(true)
        setTitle(title)
        setTimes("2")
        setPercent(0)
        ssh?.current?.reset()
        getDataList(token)

    }


    const getDataList = async (token: string) => {

        const response = await fetch("/template_data/data", {
            method: "post",
            body: JSON.stringify({
                "service": "webshell.webshell_log_query",
                "token": token,
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

    // Row Data: The data to be displayed.
    const [rowData, setRowData] = useState([]);

    function sleep(ms: number | undefined){
        return  new Promise((resolve)=>{
            setTimeout(resolve,ms)
        })
    }
    const timesChange=(value: string)=>{
        setTimes(value)
    }

    const ssh = useRef<TerminalProps>(null)
    const play=async ()=>{
        ssh?.current?.reset()

        for(let i=0;i<rowData.length;i++){
            let {data,create_time} = rowData[i]
            // @ts-ignore
            ssh?.current?.write(data)
            let p = (i+1)*100/rowData.length
            setPercent(parseInt(p+""))
            if(i+1<rowData.length){
                let next = rowData[i+1]
                let ms = (next["create_time"]-create_time)/(1000*1000)
                if(ms >3000){
                    ms=3000
                }

                // @ts-ignore
                let wait = ms/parseInt(times)
                await sleep(wait)
            }

        }
        ssh?.current?.write("\n\n\t结束!!!")

    }
    const [percent, setPercent] = useState<number>(0);
    const [times,setTimes]=useState("2")
    return (
        <Modal
            footer={null}
            maskClosable={false}
            width="90%"
            wrapClassName="history-dialog"
            style={dialogStyle}
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
                    {title}-录屏回放
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

           <div style={{'height':'800px'}}>
               <SSHTerminal ref={ssh}></SSHTerminal>
           </div>
            <div style={dialogFooterStyle}>
                <Button type="primary"
                        onClick={play}
                        icon={<CaretRightOutlined /> } size="small">

                </Button>
                <Select
                    /*@ts-ignore*/
                    defaultValue={times}
                    style={{ width: 60,marginLeft:"4px",marginRight:"4px" }}
                    size="small"
                    onChange={timesChange}
                    options={[
                        { value: "1", label: '1x' },
                        { value: "2", label: '2x' },
                        { value: "3", label: '3x' },
                        { value: "10", label: '10x' },
                        { value: "20", label: '20x' },
                    ]}
                />
                <Progress percent={percent} />

            </div>




        </Modal>
    )
}
export default forwardRef(HistoryTerm);