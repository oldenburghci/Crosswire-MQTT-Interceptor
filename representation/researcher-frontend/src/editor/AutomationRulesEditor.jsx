import {
    CircularProgress,
    Divider,
    Grid2,
    Paper,
    Stack,
    Typography
} from "@mui/material";
import {FixedSizeList} from "react-window";
import React, {useEffect, useMemo, useState} from "react";

import AutomationRuleListItem from "../items/AutomationRuleListItem.jsx";
import {createAutomationItem} from "../factories/AutomationItemFactory.js";
import {fetchAvailableDevices, filterOptions} from "./utils.js";
import AddDeviceButton from "../base/AddDeviceButton.jsx";
import "../base/TopicsListItem.css";
import {animated, useSpring} from "@react-spring/web";
import {factoryChain} from "../factories/FactoryChain.js";
import 'react18-json-view/src/style.css'
import './EntityConfigurationEditor.css'
import AutomationRuleModal from "../items/AutomationRuleModal.jsx";

export default function AutomationRulesEditor(
{
    initRulesMap = new Map(
        [
            ['automation.doorlighttoggle_2', { entityId: 'automation.doorlighttoggle', friendlyName: "Toggle DoorLight", on: false, internalId: 123}],
            ['automation.bedlightl_doubletoggle', { entityId: 'automation.bedlightl_doubletoggle', friendlyName: "Toggle Bed Light", on: true, internalId: 321}],
        ]
    ),
    onUpdate=(initialized, updated, deleted)=>{},
    resetHandler=(substitutionId)=>{},
    getSubstitutionHandler=(substitutionId) => {}
}) {

    const onEditModalClosed = () => {
        setEditModalOpen(false);
        selectedRules.forEach((rule)=> {
            rule.edit = false;
            rule.activeControlElement = { controlElement: -1, index: -1 };
        });
        setSelectedRules(new Array(...selectedRules));
    }

    const setTriggers = (triggers, index, data) => {
        const item = data[index];
        item.triggers =  Array.from(new Set(triggers));
        setSelectedRules(()=> new Array(...data));
    }

    const setConditions = (conditions, index, data) => {
        const item = data[index];
        item.conditions = Array.from(new Set(conditions));
        setSelectedRules(()=> new Array(...data));
    }

    const setActions = (actions, index, data) => {
        const item = data[index];
        item.actions = Array.from(new Set(actions));
        setSelectedRules(()=> new Array(...data));
    }

    const setOn = (state, index, data) => {
        const item = data[index];
        item.on = state;
        if (!state) item.edit = false;
        setSelectedRules(()=>new Array(...data));
    }

    const onDelete = (data, entityId) => {
        const i = data.findIndex((item)=> item.entityId === entityId);
        if (i === -1) return;
        const update = [...data.slice(0, i), ...data.slice(i + 1)];
        setDeletedItems(()=>new Array(data[i]));
        setSelectedRules(()=>new Array(...update));
    }

    const setEdit = (state, index, data) => {
        data[index].edit = state;
        setSelectedRules(new Array(...data));
        setEditModalOpen(state);
        // skips the next call of the update function
        setUpdateCounter(()=>0);
    }

    const setActiveControlElement = (indexControlElement, index, data, bypassUpdate=true) => {
        data.forEach((item) => {
            item.activeControlElement = {controlElement: indexControlElement, index: index};
        });
        setSelectedRules(()=> new Array(...data));
        if (bypassUpdate) setUpdateCounter(()=>0);
    }

    const onReset = (substitutionId )=> {
        return resetHandler(substitutionId);
    }

    const onReload = (substitutionId, index, data) => {
        getSubstitutionHandler(substitutionId).then((updatedAutomation) => {
            //only works because the then part is executed after attachHandler is loaded into memory
            attachHandler(updatedAutomation);
            data[index] = updatedAutomation;
            setSelectedRules(()=> new Array(...data));
        })
    }

    const attachHandler = (item) => {
        item.edit = false;
        item.activeControlElement = { controlElement: -1, index: -1 };
        item.onDelete = onDelete;
        item.setOn = setOn;
        item.setEdit =setEdit;
        item.setActiveControlElement = setActiveControlElement;
        item.setTriggers = setTriggers;
        item.setConditions = setConditions;
        item.setActions = setActions;
        item.onReset = onReset
        item.onReload = onReload
    }

    const onAdd = (item={entityId: ""}) => {
        const { entityId } = item;
        createAutomationItem(
            entityId
        ).then((result)=>{
            attachHandler(result);
            selectedRules.unshift(result);
            setSelectedRules(()=>new Array(...selectedRules));
        })
    }

    const update = () => {
        const [initializeCollector, updateCollector] = [[], []];
        selectedRules.forEach((item) => {
            (item.key ===  undefined) ? initializeCollector.push(item) : updateCollector.push(item);
        });
        onUpdate(initializeCollector, updateCollector, deletedItems);
        setDeletedItems(()=>new Array(0));
    }
    // --- states ---
    const [selectedRules, setSelectedRules] = useState(()=> {
        const collector = [];
        initRulesMap.forEach((item) => {
            attachHandler(item);
            collector.push(
                {
                    ...item,
                }
            );
        });
        return collector;
    });
    // --- states ---
    const [allAutomations, setAllAutomations] = useState(new Map());
    const [options, setOptions] = useState([]);
    const [initOptions, setInitOptions] = useState([]);
    const [updateCounter, setUpdateCounter] = useState(0);
    const [deletedItems, setDeletedItems ] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    // --- memos ---
    const { activeControlElement } = useMemo(()=>{
        return {
            activeControlElement: (selectedRules.length > 0) ? selectedRules[0].activeControlElement : { controlElement: -1, index: -1 },
        }
        }, [selectedRules]
    );

    const { triggersMap, conditionsMap, actionsMap } = useMemo(()=>{
        //deconstruct the automations into these 3 properties
        // the deconstruction is only to access the data more convenient
        const [triggersMap, conditionsMap, actionsMap] = [ new Map(), new Map(), new Map() ];

        allAutomations.forEach((item) => {
            const { entityId, triggers, conditions, actions } = item;
            triggersMap.set(entityId, triggers);
            conditionsMap.set(entityId, conditions);
            actionsMap.set(entityId, actions);
        })
        return { triggersMap, conditionsMap, actionsMap };
    }, [allAutomations]);
    // --- effects ---
    // fetch available rules initially
    useEffect(() => {
        fetchAvailableDevices("automation", selectedRules, false).then((result)=> {
            const {filtered, opts} = result;
            setOptions(() => filtered);
            setInitOptions(() => opts);
            return opts
        }).then((opts)=>{
            const collector = new Map();
            const promises = [];
            opts.forEach((item)=> {
                const p = factoryChain.handle("automation", item.entityId, null).then((result)=> { collector.set(result.entityId, result); });
                promises.push(p);
            });
            Promise.allSettled(promises).then(() => {
               setAllAutomations(()=>collector);
            });
        })
    }, []);

    //reduce available options after a new rule has been added
    useEffect(() => {
        const filtered = filterOptions(initOptions, selectedRules);
        setOptions(()=>filtered);
    }, [selectedRules]);

    useEffect(()=>{
        setUpdateCounter(()=>updateCounter+1 );
        if (updateCounter !== 0) update();
    }, [selectedRules]);

    // --- animation ---
    const AnimatedGrid2 = animated(Grid2);

    return <Paper
        sx={{
            borderRadius: 4

        }}
        elevation={6}
    >
        <Grid2 container size={12} spacing={1} sx={{pb:1}}>
            {/*Title*/}
            <Grid2  size={12} sx={{m: 1}}>
                {/*TODO: Icon!*/}
                <Typography variant="h5" component="div">Automation Rule</Typography>
                <Divider />
            </Grid2>

            <Grid2 size={12} sx={{m: 1}}>
                {/*Design such that this list can be reused in the RunConfiguration component*/}
                { (!loading) ? (
                    <FixedSizeList
                        itemSize={75}
                        itemCount={selectedRules.length}
                        height={selectedRules.length * 75}
                        overscanCount={5}
                        itemData={selectedRules}
                    >
                        {AutomationRuleListItem}
                    </FixedSizeList>
                ) : <CircularProgress color="primary"/>}
            </Grid2>
            <AnimatedGrid2
                size={7.2}
                sx={{mb: 1, ml:1}}
                className={(selectedRules.length % 2 === 0 ) ? "RowEven" : "RowOdd"}
            >
                <Stack
                    sx={{
                        justifyContent: "flex-start",
                        alignItems: "center",
                        height: 72,
                        ml:2.3
                    }}
                    direction="row"
                >
                    <AddDeviceButton
                        options={options}
                        onAdd={onAdd}
                        tooltip={(options.length === 0) ? "No further automations available" : "Click here to add another automation to the configuration"}
                    />
                </Stack>
            </AnimatedGrid2>
            <AutomationRuleModal
                open={editModalOpen}
                onClose={onEditModalClosed}
                data={selectedRules}
                index={activeControlElement.index}
                initOptions={initOptions}
                triggersMap={triggersMap}
                conditionsMap={conditionsMap}
                actionsMap={actionsMap}
            />
        </Grid2>
    </Paper>

}