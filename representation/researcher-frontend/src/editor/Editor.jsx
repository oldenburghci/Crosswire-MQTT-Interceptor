import {DockviewComponent, DockviewReact} from "dockview-react";
import 'dockview/dist/styles/dockview.css';
import RulesEditor from "./RulesEditor.jsx";
import DevicesEditor from "./DevicesEditor.jsx";
import RuleSubstitutionEditor from "./RuleSubstitutionEditor.jsx";
import EntityConfigurationEditor from "./EntityConfigurationEditor.jsx";
import {useEffect, useState} from "react";
import DockViewControls from "../DockviewControls.jsx";

const editorComponents = {
    default: ({params}) => {
        return (<div>
            <p>{params.title}</p>
        </div>)
    },
    rules: ({params}) => {
        return <RulesEditor {...params} />
    },
    devices: ({params}) => {
        return <DevicesEditor {...params} />
    },
    substitutions: ({params}) => {
        return <RuleSubstitutionEditor {...params} />
    },
    configurations: ({params}) => {
        return <EntityConfigurationEditor {...params} />
    },
    // iframeComponent: ({params}) => {
    //
    //     const [enabled, setEnabled] = useState(params.api.isActive);
    //
    //     useEffect(()=>{
    //         console.log(params)
    //         const disposable = params.api.onDidActivePanelChange((event) => {
    //             setEnabled(event.isActive);
    //             console.log(event);
    //         })
    //
    //         return ()=>{
    //             disposable.dispose();
    //         }
    //     }, [params.api]);
    //
    //     return <iframe
    //         style={{
    //             width: '100%',
    //             height: '100%',
    //             pointerEvents: enabled ? 'inherit' : 'none',
    //         }}
    //     >
    //         <h3>Iam an iframe!</h3>
    //     </iframe>
    // }
}



export default function Editor(props) {

    const [api, setApi] = useState();

    useEffect(() => {
        if (!api)
            return;

        const disposable = api.onDidLayoutChange(()=>{
            // console.log('layout changed');
            const serializedLayout = api.toJSON();
            localStorage.setItem('research-frontend-editor-layout', JSON.stringify(serializedLayout));
            return () => {
                disposable.dispose();
            }
        });
    }, [api]);

    const onReady = (event) => {
        setApi(event.api);
        // const api = event.api;
        const stringifyLayout = localStorage.getItem('research-frontend-editor-layout');
        if (stringifyLayout){
            try{
                const recoveredLayout = JSON.parse(stringifyLayout)
                event.api.fromJSON(recoveredLayout);
                return;
            }catch(e){
                console.error(e);
            }
        }
        //default layout
        const panel1 = event.api.addPanel({
            id: 'Rules',
            component: 'rules',
            // renderer: 'always',
            // tabComponent: 'default',
            params: {
                title: 'Rules',
            },
        });
        panel1.group.locked = true;

        event.api.addPanel({
            id: 'Substitutions',
            component: 'substitutions',
            // renderer: 'always',
            params: {
                title: 'Rule Substitution',
            },
            position: { referencePanel: 'Rules', direction: 'right' },
        })

        const devices = event.api.addPanel({
            id: 'Devices',
            component: 'devices',
            // renderer: 'always',
            params: {
                title: 'Devices',
            },
            position: { referencePanel: 'Substitutions', direction: 'right' }
        });

        event.api.addPanel({
            id: 'Entity Configurations',
            component: 'configurations',
            // renderer: 'always',
            params: {
                title: 'Entity Configurations',
            },
            position: {
                referenceGroup: devices.group,
                direction: 'below'
            }
        });
    };

    return <div className={"app"}>
        <DockviewReact
            components={editorComponents}
            rightHeaderActionsComponent={DockViewControls}
            onReady={onReady}
            className={'dockview-theme-abyss'}
        />
    </div>
}
