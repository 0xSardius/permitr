use anchor_lang::prelude::*;

#[error_code]
pub enum RegistryError {
    #[msg("Only the registry authority can write records")]
    Unauthorized,
    #[msg("Status::Unknown is client-side only and can never be written on-chain")]
    UnknownStatusNotWritable,
    #[msg("PathwayQualified requires a permitted-issuer pathway under GENIUS Act §2(23); §18 is an exception, not a permitted pathway")]
    StatusPathwayMismatch,
    #[msg("ExceptionConditionsUnmet applies only to the §18 foreign-issuer exception")]
    ExceptionStatusRequiresSection18,
    #[msg("FederalSubtype must be set iff pathway is FederalQualified (§2(11))")]
    FederalSubtypeMismatch,
    #[msg("Each basis requires at least one citation and at most two")]
    CitationCountInvalid,
    #[msg("BookSection is the analysis layer and cannot be the primary citation")]
    BookSectionCannotBePrimary,
    #[msg("Citation reference or summary exceeds the maximum length")]
    CitationTooLong,
    #[msg("Issuer name exceeds the maximum length")]
    IssuerNameTooLong,
}
