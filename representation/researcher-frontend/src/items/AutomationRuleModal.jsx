import {Box, ButtonBase, Chip, Divider, Grid2, Modal, Paper, Stack, Tooltip, Typography} from "@mui/material";
import modalStyles from "./ModalStyles.jsx";
import React from "react";
import ChipLabelMenu from "../base/ChipLabelMenu.jsx";
import JsonView from "react18-json-view";
import {animated, useSpring} from "@react-spring/web";

const Options = (
    initOptions=[],
    optionMap=new Map(),
    selectedOptions=[],
    onClick=()=>{},
    keyPrefix="select-trigger",
    color="secondary",
    option="trigger"
) => {
    return  (
        <Grid2
            container
            spacing={0.5}
        >
            {initOptions.map((item) => {
                return (new Set(selectedOptions).has(item.entityId)) ?
                    // already chosen
                    (
                        <Tooltip title={"This option is unavailable, because it is already chosen"}>
                            <Chip
                                key={`${keyPrefix}-${item.entityId}`}
                                color={`${color}`}
                                sx={{
                                    m: 0.5,
                                    ":hover": {
                                        bgcolor:`${color}.main`,
                                        alpha: 0.08
                                    }

                                }}
                                size="small"
                                label={
                                    <ButtonBase
                                        sx={{textDecorationLine: "line-through"}}
                                    >
                                        { item.friendlyName }
                                    </ButtonBase>
                                }
                            />
                        </Tooltip>
                    ) : (
                        <Tooltip
                            title={
                                (optionMap.get(item.entityId).length === 0) ? (
                                        `The ${option} is empty and not meaningful.`
                                    ) : (
                                        <span>
                                            <JsonView
                                                src={optionMap.get(item.entityId)}
                                                editable={false}
                                                theme={"atom"}
                                                dark={false}
                                            />
                                        </span>
                                )
                            }
                        >
                            <Chip
                                key={`${keyPrefix}-${item.entityId}`}
                                color={`${color}`}
                                sx={{
                                    m: 0.5,
                                    ":hover": {
                                        bgcolor:`${color}.main`,
                                        alpha: 0.08
                                    }
                                }}
                                size="small"
                                label={
                                    <ButtonBase
                                        sx={{textDecorationLine: (item.unavailable || optionMap.get(item.entityId).length === 0) ? "line-through" : "",}}
                                        onClick={
                                            (item.unavailable || optionMap.get(item.entityId).length === 0) ? () => {} : ()=>onClick(item)
                                        }
                                    >
                                        {item.friendlyName}
                                    </ButtonBase>
                                }
                            />
                        </Tooltip>
                    )
            })}
        </Grid2>
    )
}

export default function AutomationRuleModal(props={
    open: false,
    onClose: ()=>{},
    data: [],
    index: 0,
    initOptions: [],
    triggersMap: new Map(),
    conditionsMap: new Map(),
    actionsMap: new Map(),
}) {

    const {
        open,
        onClose,
        data,
        index,
        initOptions,
        triggersMap,
        conditionsMap,
        actionsMap
    } = props;

    const rule = data[index];
    const { triggers,
        conditions,
        actions,
        activeControlElement,
        setActiveControlElement,
        setTriggers,
        setConditions,
        setActions
    } = (rule!==undefined) ? rule :
            {
                triggers: [],
                conditions: [],
                actions: [],
                activeControlElement: -1,
                setActiveControlElement: () =>{},
                setTriggers: ()=>{},
                setConditions: ()=>{},
                setActions: ()=>{},
            };

    const AnimatedGrid2 = animated(Grid2);
    const growAndShrinkAnimation = useSpring({
        m: (activeControlElement.controlElement === 5) ? 0 : 5,
        from: {
            m: (activeControlElement.controlElement === 5) ? 5 : 0
        }
    })

    return (
        <Modal
            open={open}
            onClose={onClose}
        >
            <Box sx={modalStyles} className={"modal-box"}>
                <Typography
                    variant="h5"
                >
                    Edit Rule
                </Typography>
                <Divider sx={{mt:1, mb:1}}/>
                <Paper sx={{m:1}}>
                    <Grid2
                        container
                    >
                        <Grid2
                            size={12}
                            sx={{
                                m:1,
                            }}
                        >
                            <Stack
                                direction="row"
                                sx={{
                                    m:1,
                                    justifyContent: "flex-start",
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{ justifyContent: "flex-start" }}
                                >
                                    Triggers:
                                </Typography>
                            </Stack>
                            {/*Clips*/}
                            {/*Triggers*/}
                                 <Grid2
                                     container
                                     spacing={0.5}
                                 >
                                     <Grid2>
                                         <Chip
                                             color="secondary"
                                             label={
                                                 <ChipLabelMenu
                                                     onAdd={()=>{ setActiveControlElement(5, index, data) }}
                                                 />
                                             }
                                         />
                                     </Grid2>
                                     { triggers.map((item) => {
                                         if (!item) return;

                                         return (
                                             <Grid2>
                                                 <Chip
                                                     key={`trigger-indicator-${item.entityId}`}
                                                     color="secondary"
                                                     label={
                                                         <Tooltip title={<JsonView src={item.triggers}  editable={false}/>}>
                                                             {item.friendlyName}
                                                         </Tooltip>
                                                     }
                                                     sx={{ width: "100%" }}
                                                     onDelete={
                                                         ()=>{
                                                             const i = triggers.findIndex((trigger) => trigger.entityId === item.entityId)
                                                             if (i === -1) return;
                                                             const update = [...triggers.slice(0, i), ...triggers.slice(i + 1)];
                                                             setTriggers(update, index, data);
                                                         }
                                                     }
                                                 />
                                             </Grid2>
                                         )
                                        })
                                     }
                                </Grid2>
                            </Grid2>

                            <Grid2
                                size={12}
                                sx={{
                                    m:1,
                                }}
                            >
                                <Stack
                                    direction="row"
                                    sx={{
                                        m:1,
                                        justifyContent: "flex-start"
                                    }}
                                >
                                    <Typography variant="h6">
                                        Conditions:
                                    </Typography>
                                </Stack>
                                <Grid2
                                    container
                                    spacing={0.5}
                                >
                                    <Grid2>
                                        <Chip
                                            color="warning"
                                            label={
                                                <ChipLabelMenu
                                                    onAdd={()=>{ setActiveControlElement(6, index, data) }}
                                                    tooltip={"Add another condition to this definition"}
                                                />
                                            }
                                        />
                                    </Grid2>
                                    { conditions.map((item) => {
                                        if (!item) return;

                                        return (
                                            <Grid2>
                                                <Chip
                                                    key={`condition-indicator-${item.entityId}`}
                                                    color="warning"
                                                    label={
                                                        <Tooltip title={<JsonView src={ item.conditions}  editable={false}/>}>
                                                            {item.friendlyName}
                                                        </Tooltip>
                                                    }
                                                    onDelete={
                                                        ()=>{
                                                            console.log(item);
                                                            const i = conditions.findIndex((condition) => condition.entityId === item.entityId)
                                                            if (i === -1) return;
                                                            const update = [...conditions.slice(0, i), ...conditions.slice(i + 1)];
                                                            setConditions(update, index, data);
                                                        }
                                                    }
                                                />
                                        </Grid2>
                                        )
                                    })
                                    }
                                </Grid2>
                            </Grid2>

                            <Grid2
                                size={12}
                                sx={{
                                    m:1,
                                }}
                            >
                                <Stack
                                    direction="row"
                                    sx={{
                                        m:1,
                                        justifyContent: "flex-start"
                                    }}
                                >
                                    <Typography variant="h6">
                                        Actions:
                                    </Typography>
                                </Stack>
                                 <Grid2
                                     container
                                     spacing={0.5}
                                 >
                                     <Grid2>
                                         <Chip
                                             color="primary"
                                             label={
                                                 <ChipLabelMenu
                                                     onAdd={()=>setActiveControlElement(7, index, data)}
                                                     tooltip={"Add another action to this definition"}
                                                 />
                                             }
                                         />
                                     </Grid2>

                                 {actions.map((item) => {
                                     if (!item) return;

                                     return (
                                         <Grid2>
                                             <Chip
                                                 key={`action-indicator-${item.entityId}`}
                                                 color="primary"
                                                 label={
                                                     <Tooltip title={<JsonView src={item.actions}  editable={false}/>}>
                                                         {item.friendlyName}
                                                     </Tooltip>
                                                 }
                                                 sx={{
                                                     width: `100%`,
                                                 }}
                                                 onDelete={
                                                     ()=>{
                                                         const i = actions.findIndex((action) => action.entityId === item.entityId)
                                                         if (i === -1) return;
                                                         const update = [...actions.slice(0, i), ...actions.slice(i + 1)];
                                                         setActions(update, index, data);
                                                     }
                                                 }
                                             />
                                         </Grid2>
                                     )
                                 })}
                            </Grid2>
                            <Divider sx={{p:1}}/>
                            {

                                (activeControlElement.controlElement >= 5 && activeControlElement.controlElement <= 7 ) && (
                                    <Grid2
                                        size={12}
                                        sx={{
                                            m:1
                                        }}
                                    >
                                        <Grid2

                                        >
                                            <Stack
                                                direction="row"
                                                sx={{
                                                    m:1,
                                                    justifyContent: "flex-start"
                                                }}
                                            >
                                                <Typography
                                                    variant="h6"
                                                >
                                                    Available {
                                                        ["Trigger", "Condition", "Action"][activeControlElement.controlElement - 5]
                                                    }
                                                </Typography>
                                            </Stack>
                                            {
                                                (activeControlElement.controlElement === 5) && (
                                                    Options(
                                                        initOptions,
                                                        triggersMap,
                                                        rule.triggers.map((trigger)=>{
                                                            return trigger.entityId;
                                                        }),
                                                        (item)=>{
                                                            if (!item) return;
                                                            setActiveControlElement(-1, activeControlElement.index, data, false);
                                                            const next = triggersMap.get(item.entityId)[0];
                                                            setTriggers([...data[activeControlElement.index].triggers, next], activeControlElement.index, data);
                                                        },
                                                        "select-trigger",
                                                        "secondary",
                                                        "trigger"
                                                    )
                                                )
                                            }
                                            {
                                                (activeControlElement.controlElement === 6) && (
                                                    Options(
                                                        initOptions,
                                                        conditionsMap,
                                                        rule.conditions.map((condition) => {
                                                            return condition.entityId;
                                                        }),
                                                        (item)=>{
                                                            if (!item) return;
                                                            setActiveControlElement(-1, activeControlElement.index, data, false);
                                                            const next = conditionsMap.get(item.entityId)[0];
                                                            setConditions([...data[activeControlElement.index].conditions, next], activeControlElement.index, data);
                                                        },
                                                        "select-condition",
                                                        "warning",
                                                        "condition"
                                                    )
                                                )
                                            }
                                            {
                                                 (activeControlElement.controlElement === 7) && (
                                                     Options(
                                                         initOptions,
                                                         actionsMap,
                                                         rule.actions.map((action)=>{
                                                             return action.entityId;
                                                         }),
                                                         (item)=>{
                                                             if (!item) return;
                                                             setActiveControlElement(-1, activeControlElement.index, data, false);
                                                             const next = actionsMap.get(item.entityId)[0];
                                                             setActions([...data[activeControlElement.index].actions, next], activeControlElement.index, data);
                                                         },
                                                         "select-action",
                                                         "primary",
                                                         "action"
                                                    )
                                                )
                                            }
                                        </Grid2>
                                    </Grid2>
                                )
                            }
                            </Grid2>
                        </Grid2>
                </Paper>
            </Box>
        </Modal>
    )
}