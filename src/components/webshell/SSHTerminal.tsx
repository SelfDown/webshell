import React, {forwardRef, useEffect, useImperativeHandle, useRef} from 'react';
import 'xterm/css/xterm.css'; // 一定要记得引入css
import { message } from 'antd';
import { Terminal } from 'xterm';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { FitAddon } from 'xterm-addon-fit';

export interface TerminalProps {
    // namespace: string;
    // pod_Name: string;
    // container_Name: string;
    token:string;
    fit: Function;
    focus: Function;
    send:Function;
    write:Function;
    reset:Function;
}

const SSHTerminal: React.ForwardRefRenderFunction<TerminalProps,any> = (props,ref) => {
    const divRef: any = useRef(null);
    let socket: any = null;

    useImperativeHandle(ref,()=>({
        fit(){
            fitAddon.fit()
                resize()
        },
        focus(){
            terminal.focus()
        },
        send(data:string){
            sendData(data+"\r")
        },
        write(data:string){
            terminal.write(data)
        },
        reset(){
          terminal.reset()
        },
        token: props.token
    }),[props.token])
    const fitAddon = new FitAddon();
    const terminal = new Terminal({
        cursorBlink: true, // 光标闪烁
    });
    const sendData=(dataInput:string)=>{
        let data = {
            type:"text",
            data:dataInput
        }
        socket.send(JSON.stringify(data))
    }
    const resize=()=>{
        if (socket.readyState!=1){
            return
        }
        let data = {
            type:"resize",
            cols:terminal.cols,
            rows:terminal.rows
        }
        socket.send(JSON.stringify(data))
    }
    const initTerminal = () => {
        const { token } = props;
        if (token){
            let host = window.location.host
            socket = new WebSocket(`ws://${host}/template_data/ws/${token}`);
            terminal.writeln("\n\n\n")
            terminal.writeln("\t====================================")
            terminal.writeln("\t|                                  |")
            terminal.writeln("\t|                                  |")
            terminal.writeln("\t|                                  |")
            terminal.writeln("\t|            正在登陆中...         |")
            terminal.writeln("\t|                                  |")
            terminal.writeln("\t|                                  |")
            terminal.writeln("\t|                                  |")
            terminal.writeln("\t====================================\n\n\n")
            socket.onopen = () => {
                terminal.clear()
                resize()
                console.log('connection success');
            };
            socket.onerror = () => {
                terminal.writeln("\n\n\t连接出错!!!")
                message.error('连接出错')
            };
            socket.onmessage=(msg: { data: string | Uint8Array; })=>{
                let data = msg.data
                terminal.write(data)
            }
            socket.onclose=()=>{
                terminal.write("\n\n连接已经关闭...")
                console.log("连接结束")
            }
        }


        const webLinksAddon = new WebLinksAddon();
        terminal.loadAddon(webLinksAddon);
        terminal.loadAddon(fitAddon);
        // terminal.loadAddon(attachAddon);
        terminal.open(divRef.current);
        if(token){
            terminal.onData((key)=>{
                sendData(key)
            })
        }


        fitAddon.fit();

        return ()=>{
            console.log("finish")
            socket.close()
            socket = null
        }
    };

    useEffect(() => {
        if (socket) {
            socket.close();
        }

        return initTerminal();


    }, [props.token]);
    return <div  style={{ width: '100%', height: '100%',background:"#000" }} ref={divRef} />;
};

export default forwardRef(SSHTerminal);

