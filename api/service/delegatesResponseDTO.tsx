export interface DelegatesInfoDTO {
    delegateAddress: string;
    warpcast: string;
}

export interface DelegatesResponseDTO {
    hasVerifiedAddress: boolean;
    hasDelegate: boolean;
    isGoodDelegate: boolean;
    delegateInfo: DelegatesInfoDTO;
}