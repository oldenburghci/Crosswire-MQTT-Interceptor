import { createStore } from 'zustand'
import {subscribeWithSelector} from "zustand/middleware";

const useRulesStore = createStore()(
    subscribeWithSelector((set) => (
            {
                selectedRules: [],
                setSelectedRules: (rules)=> set({ selectedRules: rules }),

            }
        )
    )
)

export default useRulesStore