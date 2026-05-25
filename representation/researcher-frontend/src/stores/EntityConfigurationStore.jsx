import { createStore } from 'zustand'
import {subscribeWithSelector} from "zustand/middleware";

const useEntityConfigurationStore = createStore()(
    subscribeWithSelector((set) => (
            {
                entityToEdit: { entityId : '' },
                setEntityToEdit: (entity)=> set({ entityToEdit: entity }),
                //stores already overwritten configurations here
                entityConfigurationsEditedMap: new Map(),
                setEntityConfigurationsEditedMap: (map) => set({ entityConfigurationsEditedMap: map }),
                // store selected but not changed configurations here
                entityConfigurationsSelectedArray: [],
                setEntityConfigurationsSelectedArray: (array) => set({ entityConfigurationsSelectedArray: array }),
                // store a default configuration for each key in the entityConfigurationsSelectedArray
                entityConfigurationsSelectedMap: new Map(),
                setEntityConfigurationsSelectedMap: (map) => set({ entityConfigurationsSelectedMap: map }),
                devicesSelectedMap: new Map(),
                setDevicesSelectedMap: (map) => set({ devicesSelectedMap: map }),
            }
        )
    )
)

export default useEntityConfigurationStore