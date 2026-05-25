import ConfigurationStepper from "../navigation/ConfigurationStepper.jsx";
import {useEffect, useState} from "react";
import {
    CircularProgress, Divider,
    Grid2,
    Toolbar,
    Typography,
} from "@mui/material";
import axios from "axios";
import Memo from "./Memo.jsx";
import useCredentialStore from "../stores/CredentialStore.jsx";
import RenameModal from "./RenameModal.jsx";
import ErrorConfigurationEditor from "../editor/ErrorConfigurationEditor.jsx";
import RunConfiguration from "./RunConfiguration.jsx";
import DevicesEditor2 from "../editor/DevicesEditor2.jsx";
import {createFactoryLink, factoryChain} from "../factories/FactoryChain.js";
import AutomationRulesEditor from "../editor/AutomationRulesEditor.jsx";
import DeleteConfiguration from "./DeleteConfiguration.jsx";
import useApplicationStore from "../stores/ApplicationStore.jsx";

function prepareUpdateErrorConfigurationStep(
    suppressedTopicsMap=new Map(), interceptedTopicsMap=new Map()
) {
    const [suppressedTopics, interceptedTopics] = [[], []];

    for (const [key, value] of suppressedTopicsMap) {
        if (!value.state)
            continue;
        suppressedTopics.push({
            zigBeeID: key,
            topicName: value.topic
        });
    }

    for (const [key, value] of interceptedTopicsMap) {
        if (!value.state)
            continue;
        //config is a
        const pattern = value.config;
        pattern.forEach((interceptionPattern,k) => {
            interceptedTopics.push({
                zigBeeID: key,
                topicName: interceptionPattern.topic,
                template: interceptionPattern.template,
                rule: interceptionPattern.rule,
                interception_mode: "template"
            });
        })
    }
    return [suppressedTopics, interceptedTopics];
}

function prepareUpdateEntitiesConfigurationStep(
    entitiesMap = new Map(),
){
    const entityCollector = [];
    for (const [key, value] of entitiesMap) {
        const { service, domain, capabilities } = value;
        delete value.service;
        delete value.domain;
        delete value.capabilities;

        const entity = {
            entity: key,
            entityConfiguration: {
                json: value,
                capabilities: capabilities,
            },
            service: service,
            domain: domain,
        }
        entityCollector.push(entity);
    }

    return entityCollector;
}

export default function Configuration({
        configurations,
        setConfigurations=(configuration)=>{},
        activeConfiguration,
        activeMenuIndex=0,
        setActiveMenuIndex=(index)=>{},
        initialStepsCompleted = { 0: false, 1: false, 2: false },
        initialSteps = [
            {
                label: "Device Configurations",
                tooltip: "Click here to configure the initial device configurations."
            },
            {
                label: "Rule Set",
                tooltip: "Click here to configure the initial rule set."
            },
            {
                label: "Error Configurations",
                tooltip: "Click here to configure the error injection configurations."
            },
        ]
    }
) {
    const [ token ] = useState(useCredentialStore.getState().token);
    const [ activeStep, setActiveStep] = useState(useApplicationStore.getState().lastActiveStep);
    const [ completedSteps, setCompletedSteps] = useState(initialStepsCompleted);
    const [ steps, setSteps ] = useState(initialSteps);
    const [ renameModalActive, setRenameModalActive ] = useState(false);

    const [ entitiesMap, setEntitiesMap ] = useState(new Map());

    const [ automationsMap, setAutomationsMap ] = useState(new Map());

    const [ suppressedTopicsMap, setSuppressedTopicsMap ] = useState(new Map());
    const [ interceptedTopicsMap, setInterceptedTopicsMap ] = useState(new Map());

    const [loadDetails, setLoadDetails ] = useState(true);
    const [loadAutomations, setLoadAutomations ] = useState(true);
    const [scanInProgress, setScanInProgress ] = useState(null);


    const handleMarkCompleted = (nextState) => {
        setCompletedSteps(()=> {
            return {
                ...completedSteps,
                [activeStep]: nextState
            }
        });
    }

    const handleStepClicked = (index) => {
        setActiveStep(index);
        useApplicationStore.getState().setLastActiveStep(index);
    }

   const updateAutomationRuleConfigurationStep = (initialized = [], updated = [], deleted=[]) => {
        const promises = [];
        //only one new item is possible the way the interaction is realized currently. It is therefore safe to
        //set the received key onto the first item in initialized
        const initsWithKey = [];
        for ( const init of initialized) {
            const { service, entityId, friendlyName, definition } = init.toMessage(init);
            const p = axios.post(
                `middleware/api/configuration/${configurations[activeConfiguration].key}/automation`,
                {
                    service: service,
                    entity: entityId,
                    friendlyName: friendlyName,
                    definition: definition,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                }
            ).then((response) => {
                console.log(init);
                console.log(response);
                const { key } = response.data;
                init.key = key;
                initsWithKey.push(init);
            }).catch((error)=>console.error(error));
            promises.push(p);
        }
        for ( const update of updated ) {
            const { service, entityId, friendlyName, definition, key } = update.toMessage(update);
           const p = axios.put(
                `middleware/api/configuration/${configurations[activeConfiguration].key}/automation/${key}`,
                {
                    service: service,
                    entity: entityId,
                    friendlyName: friendlyName,
                    definition: definition,
                },{
                    headers: {
                        Authorization : `Bearer ${token}`,
                    }
                }
            ).then().catch((error)=>console.error(error));
           promises.push(p);
        }
        for (const d of deleted) {
            const { key } = d;
            // added but not uploaded ??
            if (key === undefined) continue;
            const p  = axios.delete(
                `middleware/api/configuration/${configurations[activeConfiguration].key}/automation/${key}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            ).then(()=>{}).catch((error)=>console.error(error));
            promises.push(p);
        }
        Promise.allSettled(promises).then(() => {
            const automations = new Map()
            const merged = [ ...initsWithKey, ...updated];
            merged.forEach((value, _) => {
                automations.set(value.entityId, value);
            })
            setAutomationsMap(()=> new Map(automations));
            setLoadAutomations(()=>false);
        })
   }


    const updateConfigurationMetaHandler = () => {
        axios.put(
            `middleware/api/configuration/${configurations[activeConfiguration].key}/meta`,
            {
                friendlyName: configurations[activeConfiguration].friendlyName
            },{
                headers:{
                    "Authorization": `Bearer ${token}`,
                }
            }
        ).then((response)=>{

        }).catch((e) => console.error(e));
    }

    const updateErrorConfigurationStep = () => {
        console.log('update error configuration')
        const [suppressed, intercepted] = prepareUpdateErrorConfigurationStep(suppressedTopicsMap, interceptedTopicsMap);
        console.log(suppressed, intercepted);
        axios.put(
            `middleware/api/configuration/${configurations[activeConfiguration].key}/errors`,
            {
                errorConfigurationStep: {
                    suppressedTopics: suppressed,
                    interceptedTopics: intercepted,
                    type: "errors",
                    ready: true,
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        ).then((response) => {

        }).catch((error) => {
            console.error(error);
        })
    }

    const updateEntitiesConfigurationStep = (entitiesMap = new Map()) => {

        const prepared = prepareUpdateEntitiesConfigurationStep(entitiesMap);

        axios.put(
            `middleware/api/configuration/${configurations[activeConfiguration].key}/entities`,
            {
                deviceConfigurationStep: {
                    type: "entities",
                    ready: true,
                    entities: prepared
                }
            },{
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        ).then((response) => {

        }).catch((error) => {
            console.error(error);
        })
    }

    // effects
    useEffect(() => {
        setEntitiesMap(()=>new Map());
        setSuppressedTopicsMap(()=>new Map());
        setInterceptedTopicsMap(()=>new Map());
    }, [activeConfiguration]);

    useEffect(() => {
        if (configurations[activeConfiguration].key === 0)
            return;

        //fetch a configuration based on the configurationKey
        setLoadDetails(()=>true);

        axios.get(
            `/middleware/api/configuration/${configurations[activeConfiguration].key}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            }
        ).then((response) => {
            const { data } = response;
            const completed = {}
            // we manually enrich the received the data with labels and tooltips
            // the data is picked up by the ConfigurationStepper component later on
            data.deviceConfigurationStep.label = 'Device Configurations';
            data.deviceConfigurationStep.tooltip = 'Click here to configure the initial device configurations.'
            data.rulesConfigurationStep.label = 'Rule Set'
            data.rulesConfigurationStep.tooltip = 'Click here to configure the initial rule set.'
            data.errorConfigurationStep.label  ='Error Configuration'
            data.errorConfigurationStep.tooltip  ='"Click here to configure the error injection configurations.'

            const steps = [ data.deviceConfigurationStep, data.rulesConfigurationStep, data.errorConfigurationStep ]
            setSteps(steps);
            steps.map((step, index) => {
                completed[index] =  step.ready;
            });
            //reset stepper after a new configuration has been fetched
            setCompletedSteps(completed);
            // --- Device/Entities configuration step ---
            const loadedEntitiesMap = new Map()
            for (const entity of data.deviceConfigurationStep.entities) {
                const merged  = {
                    domain : entity.domain,
                    service: entity.service,
                    json: entity.entityConfiguration.json,
                    capabilities: entity.entityConfiguration.capabilities,
                }

                loadedEntitiesMap.set(entity.entity, merged)
            }
            // --- Rules ---
            const loadedAutomations = new Map()
            for (const automation of data.rulesConfigurationStep.substitutions) {
                const { entity, definitions, service, friendlyName, key } = automation;
                if (definitions.length === 0)
                    continue;
                loadedAutomations.set(entity, {
                    entityId: entity,
                    service: service,
                    friendlyName: friendlyName,
                    domain: "automation",
                    key: key,
                    initialDefinition : definitions[0],
                    currentDefinition : (definitions.length !== 1) ? definitions[1] : definitions[0],
                });
            }
            // --- Error configuration step ---
            const initSuppressedTopicsMap = new Map()
            for (const { zigBeeID, topicName } of data.errorConfigurationStep.suppressedTopics) {
                initSuppressedTopicsMap.set(zigBeeID, { state: true ,topic: topicName})
            }
            const initInterceptedTopicsMap = new Map();
            for (const { zigBeeID, topicName, template, rule } of data.errorConfigurationStep.interceptedTopics ) {
                //we ignore the interception mode for now
                //config is an array
                const entry = initInterceptedTopicsMap.get(zigBeeID);
                let config = entry?.config;
                if (entry === undefined)
                    config = [];

                config.push({template: template, rule: rule, topic: topicName});
                initInterceptedTopicsMap.set(zigBeeID, {state: true, config: config});
            }
            setInterceptedTopicsMap(initInterceptedTopicsMap);
            setSuppressedTopicsMap(initSuppressedTopicsMap);
            return {loadedEntitiesMap, loadedAutomations};
        }).then(({loadedEntitiesMap, loadedAutomations})=>{
            const collector = new Map();
            const promises = [];
            for (const [k,v] of loadedEntitiesMap) {
                const {service, domain, json, capabilities} = v;
                if (!service || !domain || !json || !capabilities) continue;
                json.capabilities = capabilities;
                json.service = service;

                const promise = factoryChain.handle(domain, k, json).then(
                    (result) => {
                        if( result !== undefined )
                            collector.set(k ,result);
                    }
                )
                promises.push(promise);
            }
            Promise.allSettled(promises).then(() => {
                setEntitiesMap(()=>collector);
            })
            return loadedAutomations
        }).then((loadedAutomations)=>{
            //let them go through the factory
            setLoadAutomations(()=>true);
            const collector = new Map();
            const promises = [];
            loadedAutomations.forEach((value, key, _) => {
                const p = factoryChain.handle("automation", key, value).then(
                    (result) => {
                        if (result !== undefined)
                            collector.set(key ,result);
                    }
                )
                promises.push(p);
            });
            Promise.allSettled(promises).then(() => {
                console.log('allAutomations: ', collector);
                setAutomationsMap(()=>collector);
                setLoadDetails(()=> false);
            })
        })
    }, [configurations, activeConfiguration]);

    const resetHandler = (substitutionId) => {
        return axios.post(
            `/middleware/api/configuration/${configurations[activeConfiguration].key}/automation/${substitutionId}/reset`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            }
        ).then((response) => {return response})
    }

    const getSubstitutionHandler = (substitutionId) => {
        return axios.get(
            `/middleware/api/configuration/${configurations[activeConfiguration].key}/automation/${substitutionId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            }
        ).then((response) => {
            const { substitution } = response.data;
            const previous = {
                service: substitution.service,
                entityId: substitution.entity,
                friendlyName: substitution.friendlyName,
                key: substitution.key,
                currentDefinition: substitution.definition,
            };
            return factoryChain.handle('automation', substitution.entity, previous);
        })
    }

    useEffect(()=>{
        if(activeMenuIndex === 2)
            setRenameModalActive(() => true);
    },[activeMenuIndex]);

    const [nodes, setNodes] = useState([
        {
            id: '1',
            label: '1'
        },
        {
            id: '2',
            label: '2'
        }
    ]);
    const [edges, setEdges] = useState([
        {
            source: '1',
            target: '2',
            id: '1-2',
            label: '1-2'
        },
        {
            source: '2',
            target: '1',
            id: '2-1',
            label: '2-1'
        }
    ]);

    // scan
    const requestNetworkScan = () => {
        setScanInProgress(true)
        axios.get(
            "/middleware/api/network",
            {
                timeout: 30*1000,
                headers:{
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                }
            }
        ).then((response) => {

            if (response.status === 202) {
                // the request is accepted but the scan is not done yet.
                console.log("network scan in progress...");
                return
            }
            console.log(response);
            const { value } = response.data.result.data;
            const nodeDict = {}
            const nodeColors = {
                "enddevice" : "#ff7f50",
                "router" : "#90caf9",
                "coordinator" : "#a68eff",
            }

            const nodes = value.nodes.map(
                (node)=> {
                    if (node.type.toLowerCase() !== "enddevice"){
                        if (nodeDict[node.ieeeAddr] === undefined)
                            nodeDict[node.ieeeAddr] = {}
                    }
                    if(node.type.toLowerCase() === "coordinator"){
                        node.definition = {
                            model: "ZBDongle-E"
                        }
                    }

                    return {
                        x: Math.random() - 0.5,
                        y: Math.random() - 0.5,
                        size: 20,
                        id: node.ieeeAddr,
                        type: "image",
                        label: node.friendlyName,
                        deviceType: node.type,
                        networkAddress : node.networkAddress,
                        //only the coordinator has an undefined definition
                        image: (node.definition !== undefined) ? `/devices/${node.definition.model}.png` : "/devices/default.png",
                        color: nodeColors[node.type.toLowerCase()],
                        borderColor:  "#F4E3E3FF",
                        // This is a hardcoded reference for now. Further effort must be taken to enable a discovery
                        // mechanism for the mapping between nodes and topic names
                        topic: `zigbee2mqtt/${node.friendlyName}`,
                    }
                }
            );

            const edges = []

            for (const link of value.links) {
                if ( nodeDict[link.sourceIeeeAddr] !== undefined && nodeDict[link.targetIeeeAddr] !== undefined ) {
                    if (nodeDict[link.sourceIeeeAddr][link.targetIeeeAddr] === undefined &&
                        nodeDict[link.targetIeeeAddr][link.sourceIeeeAddr] === undefined)
                    {
                        nodeDict[link.sourceIeeeAddr][link.targetIeeeAddr] = true
                        nodeDict[link.targetIeeeAddr][link.sourceIeeeAddr] = true
                    }else{
                        continue
                    }
                }

                edges.push(
                    {
                        source: link.sourceIeeeAddr,
                        target: link.targetIeeeAddr,
                        id: `${link.sourceIeeeAddr}---${link.targetIeeeAddr}`,
                        label: `${link.sourceIeeeAddr}---${link.targetIeeeAddr}`,
                        size: 3,
                    }
                );
            }
            setNodes(nodes);
            setEdges(edges);
            setScanInProgress(false);
        }).catch(
            (error)=> {
                console.error(error);
                setNodes(null);
                setEdges(null);
                setScanInProgress(null);
            }
        )
    }

    //delete request
    const deleteConfiguration = () => {
        const reloadConfigurations = useApplicationStore.getState().triggerReloadConfigurations;
        axios.delete(
            `/middleware/api/configuration/${configurations[activeConfiguration].key}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                }
            }
        ).then((response)=>{
            console.log(response);
            setActiveMenuIndex(()=>-1);
            reloadConfigurations();
        }).catch((error)=> {
            console.error(error);
        })
    }


    return (
        <Grid2 container spacing={5}>
            <Grid2 size={11} >
                <Typography
                    sx={{ p:1}}
                    variant="h5"
                >
                    { (activeMenuIndex === 0) && "Edit:" } { (activeMenuIndex === 1) && "Run:" }  { configurations[activeConfiguration].friendlyName }
                </Typography>
                {/*edit Configuration */}
                {(activeMenuIndex === 0 || activeMenuIndex === 2 ) && (
                    <>
                        <ConfigurationStepper
                            activeStep={activeStep}
                            completedSteps={completedSteps}
                            onMarkedClicked={handleMarkCompleted}
                            onStepClicked={handleStepClicked}
                            steps={steps}
                        />
                        <Divider sx={{mt:1 , mb: 1}}/>
                        { (loadDetails) ? <CircularProgress/> : <>
                            {(activeStep === 0 && entitiesMap !== undefined) && (
                                <DevicesEditor2
                                    loading={loadDetails}
                                    entities={
                                       entitiesMap
                                    }
                                    onUpdate={
                                        (items, domain)=>{
                                            //the received items are valid to be uploaded into the persistence layer
                                            const itemsMap = new Map();
                                            //from other editors
                                            for (const [entityId, entity] of entitiesMap) {
                                                //discard items from the same domain, otherwise 'delete' updates will have no effect
                                                if (entityId.startsWith(domain)) continue;
                                                itemsMap.set(entityId, entity);
                                            }
                                            items.forEach((item) => {
                                                itemsMap.set(item.entityId, item);
                                            });
                                            const updateMap = new Map(itemsMap);
                                            updateMap.forEach((item) => {
                                                const m = item.toMessage();
                                                updateMap.set(m.entity_id, m);
                                            })
                                            setEntitiesMap(()=>itemsMap);
                                            updateEntitiesConfigurationStep(updateMap);
                                        }
                                    }
                                />
                            )}
                            {(activeStep === 1 ) && (
                                <AutomationRulesEditor
                                    initRulesMap={ automationsMap}
                                    resetHandler={resetHandler}
                                    getSubstitutionHandler={getSubstitutionHandler}
                                    onUpdate={
                                        (initialized, updated, deleted)=>{
                                            updateAutomationRuleConfigurationStep(initialized, updated, deleted);
                                        }
                                    }
                                />
                            )}
                            {(activeStep === 2) && (
                                <ErrorConfigurationEditor
                                    activeConfiguration={activeConfiguration}
                                    suppressedTopicsMap={suppressedTopicsMap}
                                    setSuppressedTopicsMap={setSuppressedTopicsMap}
                                    interceptedTopicsMap={interceptedTopicsMap}
                                    setInterceptedTopicsMap={setInterceptedTopicsMap}
                                    onUpdate={()=>{
                                        updateErrorConfigurationStep();
                                    }}
                                    scanRequested={scanInProgress}
                                    setScanRequested={(flag)=> {
                                        console.log('scan bubbled ', flag)
                                        setScanInProgress(flag)
                                    }}
                                    nodes={nodes}
                                    edges={edges}
                                    requestNetworkScan={requestNetworkScan}
                                />

                            )}
                        </> }

                    </>
                )}
                {/*  Run  */}
                {
                    (activeMenuIndex === 1) && (
                        (loadDetails) ? <CircularProgress color={"primary"}/> : <RunConfiguration
                                configuredEntitiesMap={entitiesMap}
                                automationsMap={automationsMap}
                                suppressedTopicsMap={suppressedTopicsMap}
                                interceptedTopicsMap={interceptedTopicsMap}
                                configuration={configurations[activeConfiguration]}
                            />
                    )
                }
                {/*  Rename  */}
                {
                    (activeMenuIndex === 2) && <>
                        <RenameModal
                            onClose={
                            ()=>{
                                    setRenameModalActive(()=>false);
                                    setActiveMenuIndex(()=>0);
                                }
                            }
                            active={ renameModalActive }
                            configurationName={ configurations[activeConfiguration].friendlyName }
                            onCommitClick={
                                (name)=>{
                                    const current = configurations[activeConfiguration];
                                    current.friendlyName = name();
                                    setConfigurations(()=>new Array(...configurations));
                                    updateConfigurationMetaHandler();
                                    setActiveMenuIndex(()=>0);
                                }
                            }
                        />
                    </>
                }
                {/* Share */}
                {

                }
                {/* Delete   */}
                {
                    (activeMenuIndex === 4) && <>
                        <DeleteConfiguration
                            friendlyName={ configurations[activeConfiguration].friendlyName }
                            commitDelete={()=>{
                                deleteConfiguration();
                            }}
                        />
                    </>
                }
            </Grid2>
            <Grid2 size={1}>
                <Toolbar/>
                    <Memo
                        configurationID={configurations[activeConfiguration].key}
                    />
            </Grid2>
        </Grid2>
    )
}