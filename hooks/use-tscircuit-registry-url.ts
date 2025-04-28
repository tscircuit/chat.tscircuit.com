export const useTscircuitRegistryUrl = () => {
    return process.env.VITE_TSCIRCUIT_REGISTRY_API_BASE_URL ?? 'https://registry-api.tscircuit.com'
}