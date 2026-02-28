import {useLoadGraph, useRegisterEvents, useSigma} from "@react-sigma/core";
import {useWorkerLayoutForce} from "@react-sigma/layout-force";
import {useEffect, useState} from "react";
import Graph from "graphology";

export default function GraphInstance(
    {
        nodes = [],
        edges = [],
        setSelectedNode = (node) => {}
    }
) {

    const loadGraph = useLoadGraph();
    const { start, kill, stop, isRunning } = useWorkerLayoutForce({ settings: { gravity: 0.0005, maxMove: 50 } });
    const [draggedNode, setDraggedNode] = useState(null);
    const registerEvents = useRegisterEvents();
    const sigma = useSigma();

    const onNodeClick = (event) => {
        const node = nodes.find((n)=>{
            return n.id == event.node
        });
        node && setSelectedNode(node);
        // console.log(node);
    }

    const onEnterNode = (event) => {
        document.body.style.cursor = "pointer";
    }

    const onLeaveNode = (event) => {
        document.body.style.cursor = "default";
    }

    const onCanvasClick = (event) => {
        setSelectedNode(()=>null);
    }

    const onDownNode = (event) => {
        setDraggedNode(()=>event.node);
        stop();
    }

    const onMouseMoveBody = (event) => {
        if (!draggedNode) return;
        // Get new position of node
        const {x, y} = sigma.viewportToGraph(event);
        sigma.getGraph().setNodeAttribute(draggedNode, 'x', x);
        sigma.getGraph().setNodeAttribute(draggedNode, 'y', y);

        // Prevent sigma to move camera:
        event.preventSigmaDefault();
        event.original.preventDefault();
        event.original.stopPropagation();
    }

    const onMouseUp = (event) => {
        if (!draggedNode) return;
        setDraggedNode(()=>null);
    }

    const onMouseDown = (event) => {
        if (!sigma.getCustomBBox()) sigma.setCustomBBox(sigma.getBBox());
    }

    useEffect(()=>{
        registerEvents({
            clickNode: onNodeClick,
            enterNode: onEnterNode,
            leaveNode: onLeaveNode,
            clickStage: onCanvasClick,
            // drag 'n' drop
            downNode: onDownNode,
            mousemovebody: onMouseMoveBody,
            mouseup: onMouseUp,
            mousedown: onMouseDown,
        });
    }, [registerEvents, sigma, draggedNode]);

    useEffect(() => {
        const graph = new Graph();

        nodes.forEach((n) => {
            const { id, x, y, size, label, type, deviceType, networkAddress, topic, image, color, borderColor } = n;
            graph.addNode(
                id, {
                    x: x,
                    y: y,
                    size: size,
                    label: label,
                    type: type,
                    deviceType: deviceType,
                    networkAddress: networkAddress,
                    topic: topic,
                    image: image,
                    color: color,
                    borderColor: borderColor,
                }
            );
        });

        edges.forEach(e => {
            const { id, size, label, source, target } = e;
            try{
                graph.addEdgeWithKey(
                    id,
                    source,
                    target,
                    {
                        label: label,
                        size: size
                    })
            } catch (e){
                console.error(e);
            }
        })
        loadGraph(graph);
        start();
        return () => {
            kill();
        }
    }, [loadGraph, start, kill, nodes, edges]);

    return null;
}