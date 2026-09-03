import { useQuery } from "@tanstack/react-query";
import { fetchCurrencies } from "../api";

export function useCurrencies() {
  return useQuery({
    queryKey: ["currencies"],
    queryFn: fetchCurrencies,
    staleTime: 5 * 60_000,
  });
}
