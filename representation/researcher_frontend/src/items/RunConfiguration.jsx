import {
    Button, ButtonGroup,
    Chip,
    CircularProgress,
    Divider,
    Grid2, Grow,
    IconButton,
    Paper, Popper,
    Stack,
    Tooltip,
    Typography
} from "@mui/material";
import TopicsList from "../base/TopicsList.jsx";
import {useEffect, useMemo, useRef, useState} from "react";
import useCredentialStore from "../stores/CredentialStore.jsx";
import axios from "axios";
import {HelpOutlined, Lightbulb} from "@mui/icons-material";
import DeployedEntitiesList from "../feedback/DeployedEntitiesList.jsx";
import VerticalSwitchIcon from "../icons/VerticalSwitchIcon.jsx";
import SwitchStateItem from "../base/SwitchStateItem.jsx";
import SwitchStateListItem from "../feedback/SwitchStateListItem.jsx";
import {config} from "@react-spring/web";
import AutomationRuleListItem from "./AutomationRuleListItem.jsx";
import AutomationRuleStateListItem from "../feedback/AutomationRuleStateListItem.jsx";
import {ArrowDropDownIcon} from "@mui/x-date-pickers";
import SplitButton from "../base/SplitButton.jsx";
import useApplicationStore from "../stores/ApplicationStore.jsx";

export default function RunConfiguration(
    {
        configuredEntitiesMap = new Map(),
        automationsMap = new Map(),
        suppressedTopicsMap=new Map(),
        interceptedTopicsMap=new Map(),
        configuration={},
    }
) {
    const [ deployOptions ] = useState(["All", "Devices", "Automations", "Topics"]);
    const [ deployLoading, setDeployLoading ] = useState(null);

    const [ undoOption ] = useState(["All", "Automations", "Suppressed Topics", "Intercepted Topics"]);
    const [ undoLoading, setUndoLoading ] = useState(null);
    //TODO: Write handler to implement the rollback functionality

    const [ releaseSuppressedLoading, setReleaseSuppressedLoading ] = useState(false);
    const [ releaseInterceptedLoading, setReleaseInterceptedLoading ] = useState(false);
    const [ loadTopics, setLoadTopics ] = useState(false);
    const [ token ] = useState(useCredentialStore.getState().token);
    const [ lastConfigurationDeployed, setLastConfigurationDeployed ] = useState("-");
    const [ lastConfigurationDeployedBy, setLastConfigurationDeployedBy ] = useState("-");

    const [ suppressedTopicsList, setSuppressedTopicsList ] = useState([]);
    const [ interceptedTopicsList, setInterceptedTopicsList ] = useState([]);

    // --- Handler ---
    const onDeployClicked = (option) => {
        setDeployLoading(()=>true);

        let url = `/middleware/api/configuration/${configuration.key}/run`

        const path ={ 'All' : '', 'Devices' : '/entities', 'Automations' : '/automations', 'Topics' : '/errors' };
        url += path[option]
        axios.post(
            url,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            }
        ).then((response) => {
            console.log(response);
            setDeployLoading(()=>false);
        }).catch(()=>setDeployLoading(()=>false));

        // setTimeout(()=>{setDeployLoading(()=>false);}, 2000);
    }

    const onUndoClicked = (option) => {
        if (option === "All"){
            onClickReleaseSuppressedTopics();
            onClickReleaseInterceptedTopics();
            resetAutomations();
            //TODO: restore entities
        }

        if (option === "Suppressed Topics")
            onClickReleaseSuppressedTopics();
        if (option === "Intercepted Topics")
            onClickReleaseInterceptedTopics();
        if (option === "Automations")
           resetAutomations();
        //TODO: restore entities
    }

    const onClickReleaseSuppressedTopics = () => {
        setReleaseSuppressedLoading(()=>true);
        axios.post(
            "/middleware/api/topics/cancel-suppression",
            {
                topics: suppressedTopicsList.map((entry) => {
                    return {
                        "name" : `${entry.topic}/#`
                    }
                })
            },
            {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        ).then((response) => {
            //handle not released topics
        }).catch((error) => {
            console.error(error);
        }).finally(()=>{
            setTimeout(()=>{
                setReleaseSuppressedLoading(()=>false);
            }, 2000);
        });
    }

    const onClickReleaseInterceptedTopics = () => {
        setReleaseInterceptedLoading(()=>true);
        axios.post(
            "/middleware/api/topics/cancel-interception",
            {
                topics: interceptedTopicsList.map((entry) => {
                    return { name: entry.topic, rule: entry.rule, template: entry.template };
                })
            },
            {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        ).then((response) => {
            //handle not released topics
            // setTimeout(()=>{
            //     setReleaseInterceptedLoading(()=>false);
            // },2000);
        }).catch((error) => {
            console.error(error);
        }).finally(()=>{
            setTimeout(()=>{
                setReleaseInterceptedLoading(()=>false);
            },2000);
        });
    }

    const resetAutomations = () => {
        setUndoLoading(()=>true);
        const promises = [];
        automationsMap.forEach((option) => {
            const { key } = option;
            const promise = resetHandler(key)
            promises.push(promise);
        });
        Promise.all(promises).then(() => {
            useApplicationStore.getState().triggerReloadConfigurations();
            setUndoLoading(()=>false);
        });
    }

    const resetHandler = (substitutionId) => {
        return axios.post(
            `/middleware/api/configuration/${configuration.key}/automation/${substitutionId}/reset`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            }
        ).then((response) => {return response})
    }

    // --- Effects ---
    useEffect(() => {
        // console.log('load');
        if (!token)
            return;
        setLoadTopics(()=>true);
        setSuppressedTopicsList(()=>[]);
        setInterceptedTopicsList(()=>[]);
        const alreadySuppressed = [];
        const alreadyIntercepted = [];
        const lastConfiguration = {}
        //get the current suppressed and intercept topics
        const suppressedPromise = axios.get(
            "/middleware/api/topics/suppressed",
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        ).then((response) => {
            const { topics } = response.data;
            alreadySuppressed.push(...topics.map((t) => {
                //remove the wildcard and last separator
                return ( t.name.endsWith("/#") ) ? t.name.substring(0, t.name.length -2) : t.name;
            }));
        }).catch((error) => {
           console.error(error);
        });

        const interceptedPromise= axios.get(
            "/middleware/api/topics/intercepted",
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        ).then((response) => {
            const { topics } = response.data;
            alreadyIntercepted.push(...topics.map((t) => { return t.name }));
            // setAlreadyInterceptedTopics(()=>alreadyIntercepted);
        }).catch((error) => {
            console.error(error);
        });

       const lastConfigurationPromise =  axios.get(
            "/middleware/api/configurations/last",
            {
                headers:{
                    "Authorization": `Bearer ${token}`
                }
            }
        ).then((response) => {
            const { friendlyName, by } = response.data;
            lastConfiguration.friendlyName = friendlyName;
            lastConfiguration.by = by;
            // setLastConfigurationDeployedBy(()=>by);
            // setLastConfigurationDeployed(()=>friendlyName);
        }).catch((error)=> console.error(error));

       Promise.allSettled([interceptedPromise, lastConfigurationPromise, suppressedPromise]).then(()=>{
           // console.log(lastConfiguration);
           setLastConfigurationDeployed(()=>lastConfiguration.friendlyName);
           setLastConfigurationDeployedBy(()=>lastConfiguration.by);

           const [suppressed, intercepted] = [[], []];
            // --- suppressed ---
           for( const [key, value] of suppressedTopicsMap  ) {
               //skip if deactivated
               if(value.state === false) continue
               const index = alreadySuppressed.findIndex((item)=> item === value.topic);
               const topic = { topic: value.topic, type: "suppress", intended: true,  alreadyHandled: (index !== -1) };
               suppressed.push(topic);
           }

           alreadySuppressed.forEach((topic) => {
               const index = suppressed.findIndex(t => t.topic === topic);
               (index === -1) && suppressed.push({ topic: topic, type: "suppress", intended: false, alreadyHandled: true });
           });
           // --- intercepted ----
           const pattern = [];
           for (const [key, value] of interceptedTopicsMap) {
               //skip if deactivated
               if (value.state === false) continue;
               const { config } = value;
               // console.log(value);
               const p = config.map((item, i) => {
                   // console.log(item);
                   return {
                       topic: item.topic,
                       template: item.template,
                       rule: item.rule
                   }
               });
               pattern.push(...p)
           }

           for (const p of pattern) {
               const index = alreadyIntercepted.findIndex(
                   //construct an adhoc list of all topic names and check if alreadyIntercepted is in it
                   (alreadyIntercepted)=> pattern.map((item, i) => item.topic).includes(alreadyIntercepted)
               );
               const topic = {  topic: p.topic, type: "intercept", intended: true,  alreadyHandled: (index !== -1), template: p.template, rule: p.rule };
               intercepted.push(topic);
           }

           alreadyIntercepted.forEach((topic) => {
               const index = intercepted.findIndex(t => t.topic === topic);
               (index === -1) && intercepted.push({topic: topic, type: "intercept", intended: false,  alreadyHandled: true });
           });

           setSuppressedTopicsList(()=>suppressed);
           setInterceptedTopicsList(()=>intercepted);
           setLoadTopics(()=>false);
       })

    }, [suppressedTopicsMap, interceptedTopicsMap, deployLoading, releaseInterceptedLoading, releaseSuppressedLoading, configuration]);


   const [adaptedAutomationsMap, setAdaptedAutomationsMap] = useState(()=>{
        const adaptedAutomationsMap = new Map()
        automationsMap.forEach((item) => {
            item.activeControlElement = { controlElement: -1, index: -1 };
            //force the element to expand
            item.edit = true;
            adaptedAutomationsMap.set(item.entityId, item);
        })
       return adaptedAutomationsMap;
    });

    return (
        <>
            <Divider sx={{mt: 1, mb: 1}} />
            <Grid2 container>
                {/*Top Buttons*/}
                <Grid2 size={12} sx={{m: 1}}>
                    <Stack direction="row" spacing={2}>
                        <SplitButton
                            pretext={"Deploy"}
                            loading={deployLoading}
                            options={deployOptions}
                            onClick={onDeployClicked}
                        />
                        <SplitButton
                            pretext={"Undo"}
                            loading={undoLoading}
                            options={undoOption}
                            onClick={onUndoClicked}
                            disabled={
                                /*disable the undo if there is no previously deployed configuration or
                                if the active configuration is not the one deployed*/
                                (lastConfigurationDeployed === "") ||
                                (lastConfigurationDeployed !== configuration.friendlyName)
                            }
                        />
                        <Chip
                            label={`last deployed: ${lastConfigurationDeployed}`}
                            color="primary"
                            sx={{p:1}}
                        />
                        <Chip
                            label={`by: ${lastConfigurationDeployedBy}`}
                            color="primary"
                            sx={{p:1}}
                        />
                    </Stack>
                </Grid2>
                <Divider sx={{mt: 1, mb: 1}} />

                {/*Entities*/}
                <Grid2 size={12} container spacing={1} sx={{mt:2}}>
                    <Grid2 size={12} >
                        <Paper
                            elevation={6}
                            sx={{
                                borderRadius: 4,
                                p: 2
                            }}
                        >
                            <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-start" }}>
                                {/*TODO: Improve Icon*/}
                                <Lightbulb/>
                                <Typography variant="h5" component="div">Lights</Typography>
                                <Divider/>
                            </Stack>
                            <DeployedEntitiesList
                                entities={configuredEntitiesMap}
                                reload={(configuredEntitiesMap.size > 0) && deployLoading}
                            />
                        </Paper>
                    </Grid2>
                    <Grid2 size={4}>
                        <Paper
                            elevation={6}
                            sx={{
                                borderRadius: 4, p: 2
                            }}
                        >
                            <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-start" }}>

                                <VerticalSwitchIcon/>
                                <Typography variant="h5" component="div">Switches</Typography>
                                <Divider/>
                            </Stack>
                            <DeployedEntitiesList
                                entities={configuredEntitiesMap}
                                reload={(configuredEntitiesMap.size > 0) && deployLoading}
                                displayDomain={"switch"}
                                displayItems={{ current: SwitchStateListItem, target: SwitchStateListItem} }
                                styles={{
                                    itemHeight: 65,
                                    currentGridSize: 3,
                                    targetGridSize: 9
                                }}
                            />
                        </Paper>
                    </Grid2>
                    {/*Automations*/}

                    <Grid2 size={12} spacing={1}>
                        <Paper elevation={6} sx={{ borderRadius: 4, p:2  }}>
                            <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-start" }}>
                                {/*TODO: logo wanted*/}
                                <Typography variant="h5" component="div"> Automations </Typography>
                                <Divider/>
                            </Stack>
                            {
                                (adaptedAutomationsMap !== undefined) ? <DeployedEntitiesList
                                    entities={adaptedAutomationsMap}
                                    // the skeleton elements increase the size which makes the reloading/button clicking
                                    // an awful experience due to the change in size
                                    reload={(adaptedAutomationsMap.size > 0) && deployLoading}
                                    displayDomain={"automation"}
                                    displayItems={{current:  AutomationRuleStateListItem, target: AutomationRuleStateListItem }}
                                    styles={{
                                        itemHeight: 120,
                                        currentGridSize: 4,
                                        targetGridSize: 8,
                                    }}
                                /> : <CircularProgress color={"primary"}/>
                            }
                        </Paper>
                    </Grid2>

                </Grid2>


                {/*Topics*/}
                <Grid2 size={12} sx={{mt:2}} container spacing={1}>
                    {/*<Divider sx={{mt: 1, mb: 1}} />*/}
                    <Grid2  size={5}>
                        {/*<Stack*/}
                        {/*    spacing={2}*/}
                        {/*    direction="column"*/}
                        {/*>*/}
                            <Paper
                                elevation={6}
                                sx={{
                                    borderRadius: 4,
                                    p:1
                                }}
                            >
                                <Typography variant="h5" textAlign="left" sx={{ml:4, mt: 1, mb: 1}}> Suppressed Topics: </Typography>
                                <TopicsList items={suppressedTopicsList} loading={releaseSuppressedLoading || loadTopics}/>
                            </Paper>
                    </Grid2>
                    <Grid2 size={7}>
                        <Paper
                            elevation={6}
                            sx={{
                                borderRadius: 4,
                                p:1
                            }}
                        >
                            <Typography variant="h5" textAlign="left" sx={{ml:4, mt: 1, mb: 1}}> Intercepted Topics: </Typography>
                            <TopicsList items={interceptedTopicsList} loading={releaseInterceptedLoading || loadTopics}/>
                        </Paper>
                    </Grid2>
                    {/*</Stack>*/}
                </Grid2>
            </Grid2>
        </>

    )
}
