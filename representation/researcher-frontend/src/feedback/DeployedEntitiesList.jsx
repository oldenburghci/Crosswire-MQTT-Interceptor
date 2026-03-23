import {useEffect, useMemo, useState} from "react";
import {Box, CircularProgress, Divider, Grid2, Skeleton, Stack, Typography} from "@mui/material";
import {East, Lightbulb, West} from "@mui/icons-material";
import {FixedSizeList} from "react-window";
import LightListItem from "../base/LightListItem.jsx";
import LightStateListItem from "./LightStateListItem.jsx";
import axios from "axios";
import useCredentialStore from "../stores/CredentialStore.jsx";
import promiseCollector from "lodash/_SetCache.js";
import {createLightItem} from "../factories/LightItemFactory.js";
import {factoryChain} from "../factories/FactoryChain.js";

export default function DeployedEntitiesList({
    entities = new Map(),
    reload = false,
    displayDomain="light",
    displayItems={ target: LightListItem, current: LightStateListItem },
    styles={
        itemHeight: 65,
        currentGridSize: 5,
        targetGridSize: 6
    }

}) {
    // console.log(entities);
    // --- memos ----
    const {targetStates} = useMemo(() => {
        const targetItems = [];
        // const currentItem = [];
        for (const [key, value] of entities ){
            //todo: fragile construct, need improvement
            const domain = key.split('.')[0]
            if (domain !== displayDomain ) continue
            const target = {...value, isReadOnly: true, hideName: false}
            targetItems.push(target);
        }
        targetItems.sort((a, b) => (a.entityId < b.entityId) ? 1 : -1);
        return {
            targetStates: targetItems,
        }
    }, [entities]);
    // console.log(targetStates);
    // --- states ----
    const [loading, setLoading] = useState(true);
    const [currentStates, setCurrentStates] = useState([]);
    // --- effects ---
    // useEffect(() => {
    //     setTimeout(() => {
    //         setLoading(false);
    //     },1500);
    // }, []);

    useEffect(() => {
        setLoading(()=>true);
        // check the current state of the target devices to display them side by side
        const promisesCollector = [];
        const entitiesCollector = [];
        const fetchedStates = [];
        targetStates.forEach((entity) => {
            entitiesCollector.push(entity.entityId)
        });
        entitiesCollector.forEach(
            (item, _) => {
                const p = factoryChain.handle(displayDomain, item).then(result => {
                    result.hideName = true;
                    fetchedStates.push(result)
                });
                // console.log(p);
                promisesCollector.push(p);
            }
        );
        Promise.allSettled(promisesCollector).then(
            ()=>{
                //settle and sort
                fetchedStates.sort((a,b) => (a.entityId < b.entityId) ? 1 : -1 );
                // console.log('all settled and sorted:', targetStates, fetchedStates);
                setCurrentStates(fetchedStates);
                setLoading(()=>false)
            }
        )
    }, [targetStates, reload]);

    return (
        <Box
            sx={{
                minHeight: (targetStates === undefined) ? styles.itemHeight : styles.itemHeight*targetStates.length,
                // height: 400,
                // bgcolor: 'background.paper',
                // position: 'relative',
                borderRadius: 10,
            }}
        >
            <Grid2
                container
                size={12}
            >
                { (loading || reload) && <Grid2 size={12}>
                            <Stack direction="row" sx={{m: 0.5, pt: 1, justifyContent: "space-evenly", height:45}}>
                                <Skeleton variant="rounded" width={"30%"} />
                                <Skeleton variant="rounded" width={"30%"} />
                            </Stack>
                            <Stack spacing={2} direction="row"  sx={{m:0.5, mb: 0, pt:1, height: styles.itemHeight}} >
                                <Skeleton variant="rounded" width={"50%"}   sx={{m:1}} height={"100%"}/>
                                <Skeleton variant="rounded" width={"100%"}  sx={{m:1}} height={"100%"}/>

                            </Stack>
                            <Stack spacing={2} direction="row"  sx={{m:0.5, mb: 0, pt:1, height: styles.itemHeight}} >
                                <Skeleton variant="rounded" width={"100%"}  sx={{m:1}} height={"100%"}/>
                                <Skeleton variant="rounded" width={"60%"} sx={{m:1}} height={"100%"}/>
                            </Stack>
                </Grid2> }
                {
                    // (loading) &&  <CircularProgress color="primary" />
                    (!loading && !reload )  && (
                        <Grid2 size={12} container>
                            <Grid2 size={styles.targetGridSize}>
                                {(targetStates.length > 0) && (
                                    <>
                                        <Typography variant="body" component="div">Target</Typography>
                                        <FixedSizeList
                                            height={targetStates.length * styles.itemHeight}
                                            itemSize={styles.itemHeight}
                                            itemCount={targetStates.length}
                                            overscanCount={5}
                                            itemData={targetStates}
                                        >
                                            {
                                                displayItems.target
                                            }
                                        </FixedSizeList>
                                    </>)}
                            </Grid2>
                            <Grid2 size={12 - ( styles.currentGridSize + styles.targetGridSize )}/>
                            <Grid2 size={styles.currentGridSize}>
                                {(currentStates.length > 0) && (
                                    <>
                                        <Typography variant="body" component="div">Current</Typography>
                                        <FixedSizeList
                                            height={targetStates.length * styles.itemHeight}
                                            itemSize={styles.itemHeight}
                                            itemCount={targetStates.length}
                                            overscanCount={5}
                                            itemData={currentStates}
                                        >
                                            {
                                                displayItems.current
                                            }
                                        </FixedSizeList>
                                    </>)}
                            </Grid2>
                        </Grid2>
                    )
                }
            </Grid2>
        </Box>
    )

}