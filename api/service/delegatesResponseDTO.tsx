export interface DelegatesResponseDTO {
    hasVerifiedAddress: boolean;
    hasDelegate: boolean;
    isGoodDelegate: boolean;
    delegateInfo: DelegatesInfoDTO;
}

export interface DelegatesInfoDTO {
    delegateAddress: string;
    warpcast: string;
}