import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import {Button, Form, Input, Modal, Popconfirm} from 'antd';
import {
   LoginOutlined,
   LogoutOutlined
} from '@ant-design/icons';
// @ts-ignore
import Draggable, {DraggableData, DraggableEvent} from "react-draggable";
export interface HeaderProps {

   showLogin:Function,
   token: string,

}
const rightTool:React.CSSProperties={
   display: "inline-block",
   textAlign:"right",
   position:"absolute",
   right:"10px"
}
const loginBtn:React.CSSProperties={
   color:"white"
}
const errMsgStyle:React.CSSProperties={
    color:"red"
}
const CollectHeader: React.ForwardRefRenderFunction<HeaderProps, any> = (props, ref) => {

    useEffect(() => {
        getCurrentUser()


    }, [props.token]);
   useImperativeHandle(ref,()=>({
      showLogin(){

      },
      token: props.token
   }),[props.token])
   const [isModalOpen, setIsModalOpen] = useState(false);

   const [userInfo,setUserInfo]=useState({nick:"",userid:"",username:""})
   const handleOk = () => {
      setIsModalOpen(false);
   };

   const handleCancel = () => {
      setIsModalOpen(false);
   };

   const onFinish = async (values: any) => {

      login()

   };
   const [disabled, setDisabled] = useState(true);
   const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
   const draggleRef = useRef<HTMLDivElement>(null);
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
   const onFinishFailed = (errorInfo: any) => {
      console.log('Failed:', errorInfo);
   };
   const [form] = Form.useForm();
   type FieldType = {
      username?: string;
      password?: string;
   };
   function Login(){
      setIsModalOpen(true)
   }
   function Logout(){
       logout().then(r => {
           getCurrentUser()
       })
   }

   const [errMsg,setErrMsg]=useState("")
    const getCurrentUser=async ()=>{
        let params={
            "service":"system.current_user"
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
        if(data.code =="0"){
            setUserInfo(data.data)
            window.localStorage.setItem("username",data.data.username)
        }else{
            setIsModalOpen(true)
            let username = window.localStorage.getItem("username")
            if(username){
                form.setFieldValue("username",username)
            }
        }
    }
   const login=async () => {

      let params={
         "service":"system.login",
         "username": form.getFieldValue("username"),
         "password": form.getFieldValue("password"),
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
      if(data.code =="0"){
         setIsModalOpen(false);
         setUserInfo(data.data)
         window.location.reload()
         window.localStorage.setItem("username",form.getFieldValue("username"))
         setErrMsg("")
      }else{
          setErrMsg(data.msg)
      }
      return data.data

   }
   const logout=async () => {
      let params={
         "service":"system.logout"

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
      if(data.code =="0"){
         setIsModalOpen(false);
         setUserInfo(data.data)
         setErrMsg("")

      }else{
          setErrMsg(data.msg)
      }
      return data.data

   }
   return (
       <div>
          COLLECT
          <div style={rightTool}>
              {userInfo.nick}
              {!userInfo.userid && <Button
                  onClick={Login}
                  icon={<LoginOutlined/> }
                  style={loginBtn}
                  type="text">登陆
              </Button>}


              {userInfo.userid &&  <Popconfirm
                  placement="bottom"
                  title="确认"
                  description="确定注销吗"
                  okText="确定"
                  cancelText="取消"
                  onConfirm={Logout}
              >
                  <Button

                      icon={<LogoutOutlined /> }
                      style={loginBtn}
                      type="text">注销
                  </Button>
              </Popconfirm>}
          </div>

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
                    用户登录
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
                 autoComplete="off"
                 form={form}

             >
                <Form.Item<FieldType>
                    label="用户名"
                    name="username"

                    rules={[{ required: true, message: '用户名不能为空！' }]}
                >
                   <Input  />
                </Form.Item>

                <Form.Item<FieldType>
                    label="密码"
                    name="password"
                    rules={[{ required: true, message: '密码不能为空' }]}
                >
                   <Input.Password />
                </Form.Item>

                <Form.Item wrapperCol={{ offset: 9, span: 6 }}>
                   <Button
                       onClick={onFinish}
                       block
                       type="primary" htmlType="submit">
                      登 陆
                   </Button>
                </Form.Item>
                 <span style={errMsgStyle}>{errMsg}</span>
             </Form>
          </Modal>
       </div>
   )
}
export default forwardRef(CollectHeader);