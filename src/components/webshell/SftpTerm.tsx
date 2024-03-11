import React, {forwardRef, useImperativeHandle, useRef, useState,} from "react";
import type {DraggableData, DraggableEvent} from 'react-draggable';
import Draggable from 'react-draggable';
import {Button, Input, Modal, Form, Table, message, Popconfirm,Upload,UploadFile} from 'antd';
import {
    SearchOutlined,
    UploadOutlined,
    FolderOutlined,
    FileOutlined,
    DownloadOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import {AgGridReact} from 'ag-grid-react'; // React Grid Logic
import "ag-grid-community/styles/ag-grid.css"; // Core CSS
// import "ag-grid-community/styles/ag-theme-quartz.css"; // Theme
import "ag-grid-community/styles/ag-theme-balham.css"
import "./sftp.css"

export interface SftpProps {

    show: Function
}

const formItemInputStyle = {
    width: '400px',
    marginBottom: '10px',
};
const uploadStyle = {
    marginLeft: "40px"
}
import type { UploadProps } from 'antd';

const SftpTerm: React.ForwardRefRenderFunction<SftpProps, any> = (props, ref) => {

    const [disabled, setDisabled] = useState(true);
    const [bounds, setBounds] = useState({left: 0, top: 0, bottom: 0, right: 0});
    const draggleRef = useRef<HTMLDivElement>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const handleCancel = () => {
        setIsModalOpen(false);
    };
    useImperativeHandle(ref, () => ({
        show(token: string, path: string, title: string) {
            show(token, path, title)
        },
        token: props.token,
        path: props.path
    }), [props.token])
    const [title, setTitle] = useState("")
    const show = (token: string, path: string, title: string) => {
        setIsModalOpen(true)
        form.setFieldValue("path", path)
        form.setFieldValue("token", token)
        setTitle(title)
        setPathList()
    }
    const afterOpenChange = (open: Boolean) => {
        if (!open) {
            props.onChangePath(form.getFieldValue("path"))
        }
    }
    const setPathList = async () => {

        const response = await fetch("/template_data/data", {
            method: "post",
            body: JSON.stringify({
                "service": "webshell.get_dir_info_by_token",
                "token": form.getFieldValue("token"),
                "path": form.getFieldValue("path")
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
        let current_dir = data.data.current_dir

        form.setFieldValue("path", current_dir)
        form.setFieldValue("lastPath", current_dir)
        let dir = data.data.dir
        if (current_dir != "/") {
            dir.unshift({"name": "..", is_dir: true});
        }
        setRowData(dir)
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
        path?: string;


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
            // if(tmp.length==0){
            //     path="/"
            // }else {
            //     path = tmp.join("/")
            // }

        } else {
            if (path.lastIndexOf("/") == path.length - 1) {
                path += data.name
            } else {
                path += "/" + data.name
            }


        }
        form.setFieldValue("path", path)
        setPathList()
    }
    const cellNameRender = (props: any) => (
        <React.Fragment>
            {props.data.is_dir ? (
                <span onClick={() => openFolder(props.data)} className="sftp-folder">
                     <FolderOutlined className="file-icon"/>
                    {props.value}
                    </span>
            ) : (
                <span className="sftp-file">
                    <FileOutlined className="file-icon"/>
                    {props.value}
                    </span>
            )
            }

        </React.Fragment>
    )
    const FileType = (props: any) => (
        <React.Fragment>
            {props.data.is_dir ? "文件夹" : "文件"}
        </React.Fragment>
    )

    function convertRes2Blob(response: any) {
        // 提取文件名
        let desc = response.headers.get("content-disposition")
        const fileName = desc.match(
            /filename=(.*)/
        )[1]
        // 将二进制流转为blob
        // const blob = new Blob([response.body], {type: 'application/octet-stream'})
        response.blob().then((blob: Blob | MediaSource) => {
            // @ts-ignore
            if (typeof window.navigator.msSaveBlob !== 'undefined') {
                // 兼容IE，window.navigator.msSaveBlob：以本地方式保存文件
                // @ts-ignore
                window.navigator.msSaveBlob(blob, decodeURI(fileName))
            } else {
                // 创建新的URL并指向File对象或者Blob对象的地址
                const blobURL = window.URL.createObjectURL(blob)
                // 创建a标签，用于跳转至下载链接
                const tempLink = document.createElement('a')
                tempLink.style.display = 'none'
                tempLink.href = blobURL
                tempLink.setAttribute('download', decodeURI(fileName))
                // 兼容：某些浏览器不支持HTML5的download属性
                if (typeof tempLink.download === 'undefined') {
                    tempLink.setAttribute('target', '_blank')
                }
                // 挂载a标签
                document.body.appendChild(tempLink)
                tempLink.click()
                document.body.removeChild(tempLink)
                // 释放blob URL地址
                window.URL.revokeObjectURL(blobURL)
            }
        })

    }

    function removeFile(data: { name: string; }) {
        let path = form.getFieldValue("lastPath")
        path += "/" + data.name
        fetch("/template_data/data", {
            method: "post",
            body: JSON.stringify({
                "service": "webshell.remove_file_by_token",
                "token": form.getFieldValue("token"),
                "path": path
            }),
            headers: {
                'Content-Type': "application/json",
                Accept: "application/json"
            }
        }).then(async response => {

            const data = await response.json()
            if (data.success) {
                setPathList()
            } else {
                message.error(data.msg)
            }
        })
    }

    function downloadFile(data: { name: string; }) {
        let path = form.getFieldValue("lastPath")
        path += "/" + data.name
        fetch("/template_data/data", {
            method: "post",
            body: JSON.stringify({
                "service": "webshell.download_by_token",
                "token": form.getFieldValue("token"),
                "path": path
            }),
            headers: {
                'Content-Type': "application/json",
            }
        }).then(response => {
            convertRes2Blob(response)
        })
    }

    const OperationType = (props: any) => (

        <React.Fragment>
            {!props.data.is_dir && <Button
                type="text"
                onClick={() => downloadFile(props.data)}
                icon={<DownloadOutlined/>} size="small">
                下载
            </Button>}
            {!props.data.is_dir &&

                <Popconfirm
                    title="警告"
                    description="确认删除所选记录吗?"
                    onConfirm={() => removeFile(props.data)}
                    okText="确认"
                    cancelText="取消"
                >
                    <Button
                        danger
                        type="text"
                        icon={<DeleteOutlined/>} size="small">
                        删除
                    </Button>
                </Popconfirm>
            }
        </React.Fragment>
    )
    // Column Definitions: Defines & controls grid columns.
    const [colDefs, setColDefs] = useState([
        {
            field: "name",
            headerName: "名称",
            minWidth: 120,
            cellRenderer: cellNameRender,
            flex: 1,
        },
        {field: "size_info", headerName: "大小", width: 160},
        {
            field: "is_dir",
            headerName: "类型",
            cellRenderer: FileType,
            width: 160
        },
        {field: "modify_time", headerName: "修改时间", width: 160},
        {
            field: "",
            headerName: "操作",
            width: 160,
            cellRenderer: OperationType
        },
    ]);


    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const uploadProps: UploadProps = {
        name: 'file',
        action: '/template_data/data',
        // @ts-ignore
        data:(file)=>{
                return {
                    "service":"webshell.upload_file_by_token",
                    "path":form.getFieldValue("lastPath"),
                    "token":form.getFieldValue("token")
                }
        },
        onChange(info) {
            setFileList([...info.fileList])
            if (info.file.status !== 'uploading') {
                console.log(info.file, info.fileList);
            }
            if (info.file.status === 'done') {

                // setFileList([])
                setPathList()
                setFileList([])
                message.success(`${info.file.name} 上传成功`);
            } else if (info.file.status === 'error') {
                message.error(`${info.file.name} 上传失败.`);
            }
        },
         fileList
    };

    return (
        <Modal
            footer={null}
            maskClosable={false}
            afterOpenChange={afterOpenChange}
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
                    {title}-文件管理
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
                        label="路径"
                        name="path"
                        style={formItemInputStyle}>
                        <Input onPressEnter={setPathList}></Input>
                    </Form.Item>
                    <Form.Item>
                        <Button icon={<SearchOutlined/>} onClick={setPathList}>刷新</Button>
                        <Upload   {...uploadProps}  >
                            <Button  style={uploadStyle} icon={<UploadOutlined/>}>上传</Button>
                        </Upload>
                    </Form.Item>
                </Form>

                <div className="ag-theme-balham" style={{height: 500, width: "100%"}}>

                    <AgGridReact

                        rowData={rowData}
                        /* @ts-ignore */
                        columnDefs={colDefs}/>
                </div>

            </div>
        </Modal>
    )
}
export default forwardRef(SftpTerm);