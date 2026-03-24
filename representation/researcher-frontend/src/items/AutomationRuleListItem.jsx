import {
    Badge,
    Chip,
    IconButton,
    Paper,
    Stack,
    Tooltip,
    Typography
} from "@mui/material";
import VerticalSwitch from "../base/VerticalSwitch.jsx";
import {AnimatedListItem} from "../base/LightListItem.jsx";
import {animated, useSpring} from "@react-spring/web";
import { Delete, Edit, RestartAlt} from "@mui/icons-material";
import {useState} from "react";

export default function AutomationRuleListItem(props) {
    if (props === undefined) return <></>
    const { index, data } = props;
    const {
        internalId,
        friendlyName,
        on, setOn,
        onDelete,
        entityId,
        edit, setEdit,
        activeControlElement, setActiveControlElement,
        triggers, setTriggers,
        conditions, setConditions,
        actions, setActions,
        onReset, onReload,
        key
    } = data[index];

    const appearProps = useSpring({
        opacity: 1,
        from: {
            opacity: 0,
        }
    });

    const shiftProps = {
        width: "100%"
    }

    const AnimatedStack = animated(Stack);

    const [ loading, setLoading ] = useState(false);


    return (
        <AnimatedListItem
            style={{...appearProps}}
            className={index % 2 === 0 ? "RowEven" : "RowOdd"}
        >
            <AnimatedStack
                spacing={2}
                sx={{
                    overflow: "hidden",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
                style={{...shiftProps}}
                direction="row"
            >
                <VerticalSwitch
                    on={on}
                    onChange={
                        () => {
                            setOn(!on, index, props.data);
                        }
                    }
                    tooltips={["Automation rule is active", "Automation rule is inactive"]}
                />
                <Stack sx={{ minWidth: 0, width: "40vw" }}>
                    <Tooltip title={(friendlyName !== undefined) ? friendlyName : ""}>
                        <Typography sx={{ml: 1, wordBreak: "break-word"}} noWrap>{friendlyName}</Typography>
                    </Tooltip>
                </Stack>
                {/*indicator*/}
                <AnimatedStack
                    direction="row"
                    spacing={1}
                    sx={{

                        justifyContent: "space-around",
                    }}
                    style={{...shiftProps}}
                >
                    {/*Triggers*/}
                    {
                        (<Badge badgeContent={triggers.length} color={"secondary"}><Chip color="secondary" label={"triggers"}/></Badge>)
                    }
                    {/*Conditions*/}
                    {
                        (<Badge badgeContent={conditions.length} color={"warning"}><Chip color="warning" label={"conditions"}/></Badge>)
                    }
                    {/*Actions*/}
                    {
                        ( <Badge badgeContent={actions.length} color={"primary"}>
                            <Chip
                                color="primary"
                                size="medium"
                                label={"actions"}
                            />
                        </Badge> )

                    }
                </AnimatedStack>
                {/*Tools*/}
                <Paper
                    sx={{ borderRadius:4 }}
                    elevation={4}
                >
                    <Stack
                        direction="row"
                        spacing={1}
                    >
                        <Tooltip title={
                                (on) ?
                                    ( edit ? "Deactivate modifications to triggers, conditions or action" : "Click to edit and activate modification to triggers, conditions or actions of this automation rule" ) :
                                    "Only active automation rules can be edited further."
                            }
                        >
                            <IconButton
                                color={
                                    edit ? ( (activeControlElement.index === index && activeControlElement.controlElement === 0 ) ? "secondary": "primary") : "default"
                                }
                                sx={{
                                    border: (edit && on) ? "2px solid" : "2px solid transparent",
                                }}
                                disabled={!on}
                                onClick={
                                    ()=>{
                                        if(!edit) {
                                            setActiveControlElement(0, index, props.data);
                                            setEdit(true, index, props.data);
                                        }else{
                                            setActiveControlElement(-1, -1, props.data);
                                            setEdit(false, index, props.data);
                                        }
                                    }
                                }
                            >
                                <Edit
                                    className={(activeControlElement.index === index && activeControlElement.controlElement === 0) ? "breath" : ""}
                                />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={"Reset the trigger, condition and action to the initial definition"}>
                            <IconButton
                                disabled={(key === undefined)}
                                loading={loading}
                                onClick={
                                    ()=>{
                                        setLoading(true)
                                        onReset(key).then(()=> {
                                            onReload(key, index, data);
                                            setTimeout(()=>{ setLoading(false) },1000)
                                        })
                                    }
                                }
                            >
                                <RestartAlt/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={"Remove automation from the configuration"}>
                            <IconButton
                                loading={loading}
                                onClick={() => { onDelete(data, entityId)}}
                            >
                                <Delete/>
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Paper>
            </AnimatedStack>
        </AnimatedListItem>
    )
}