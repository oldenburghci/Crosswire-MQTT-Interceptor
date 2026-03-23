import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MaximizeIcon from '@mui/icons-material/Maximize';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import MinimizeIcon from '@mui/icons-material/Minimize';
import {Button, Stack, Tooltip} from "@mui/material";
import {useEffect, useState} from "react";

export default function DockViewControls(props) {
    // see https://github.com/mathuo/dockview/blob/master/packages/docs/templates/dockview/demo-dockview/react/src/controls.tsx

    const [isPopout, setIsPopout] = useState(
        props.api.location.type === 'popout'
    );

    const [isMaximized, setIsMaximized] = useState(
        props.containerApi.hasMaximizedGroup()
    );

    const onMinimizeHandler = () => {
        if (props.containerApi.hasMaximizedGroup()) {
            props.containerApi.exitMaximizedGroup();
        } else {
            props.activePanel?.api.maximize();
        }
    };

    const onPopoutHandler = () => {
        // const { containerApi } = props;
        alert('upcoming feature :P')
        // console.log(props);
        // if (props.api.location.type !== 'popout') {
        //     const jsonLayout = props.containerApi.toJSON();
        //     localStorage.setItem('research-frontend-editor-layout', JSON.stringify(jsonLayout));
        //     props.containerApi.addPopoutGroup(
        //         props.group,
        //         {
        //             popoutUrl : "/popout2.html",
        //             box: {
        //                 left: 0,
        //                 top: 0,
        //                 height: 300,
        //                 width:200
        //             }
        //         }
        //     );
        // } else {
        //     // restore the last layout from the localstorage
        //     const stringifyLayout = localStorage.getItem('research-frontend-editor-layout');
        //     if (stringifyLayout) {
        //         try{
        //             const layout = JSON.parse(stringifyLayout);
        //             props.containerApi.fromJSON(layout);
        //         } catch (error){
        //             console.error(error);
        //             props.api.moveTo({ position: 'right' });
        //         }
        //     }
        // }
    };

    useEffect(() => {
        const disposable = props.containerApi.onDidMaximizedGroupChange(() => {
            setIsMaximized(props.containerApi.hasMaximizedGroup());
        });

        const disposable2 = props.api.onDidLocationChange(() => {
            setIsPopout(props.api.location.type === 'popout');
        });

        return () => {
            disposable.dispose();
            disposable2.dispose();
        };
    }, [props.containerApi]);

    return (
        <div
            className="group-control"
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0px 8px',
                height: '100%',
                color: 'var(--dv-activegroup-visiblepanel-tab-color)',
            }}
        >
           <Stack direction="row" spacing={0}>
               {
                   (isMaximized) ?(
                        <Tooltip title={"Minimize"}>
                           <Button onClick={onMinimizeHandler}>
                               <MinimizeIcon size={"small"} color="primary"/>
                           </Button>
                        </Tooltip>
                   ) : (
                       <Tooltip title={"Maximize"}>
                           <Button onClick={onMinimizeHandler}>
                               <MaximizeIcon size={"small"} color="primary"/>
                           </Button>
                       </Tooltip>
                   )
               }

               {
                   (!isPopout) ? (
                       <Tooltip title={"Open this panel in a new Window"}>
                           <Button onClick={onPopoutHandler}>
                               <OpenInNewIcon size={"small"} color="primary"/>
                           </Button>
                       </Tooltip>
                   ) : (
                       <Tooltip title={"Reset this panel"}>
                           <Button onClick={onPopoutHandler}>
                               <CloseFullscreenIcon size={"small"} color="primary"/>
                           </Button>
                       </Tooltip>
                   )
               }
           </Stack>
        </div>
    )
}