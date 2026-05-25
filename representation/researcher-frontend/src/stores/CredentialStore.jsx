import { createStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

const useCredentialStore = createStore()(
    subscribeWithSelector((set)=> (
            {
                token: "",
                setToken: (token) => set({ token: token }),
            }
        )
    )
)

export default useCredentialStore;