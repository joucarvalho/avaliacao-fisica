import { lazy } from "react";

// O Relatório carrega `recharts` (~340 KB gz) só quando o usuário navega pra
// /relatorio — mantém o bundle inicial leve. A MESMA função de import serve
// ao lazy() (renderiza sob demanda) e ao preload (adianta o download); o
// browser cacheia o chunk, então a 2ª chamada reaproveita a 1ª.
const carregarRelatorio = () => import("@/pages/Relatorio");

export const Relatorio = lazy(carregarRelatorio);
export const preloadRelatorio = carregarRelatorio;
