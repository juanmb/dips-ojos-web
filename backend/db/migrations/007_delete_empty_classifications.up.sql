DELETE FROM Classifications
WHERE left_asymmetry = 0
  AND right_asymmetry = 0
  AND increased_flux = 0
  AND decreased_flux = 0
  AND normal_transit = 0
  AND anomalous_morphology = 0
  AND marked_tdv = 0
  AND bad_model_fit = 0
  AND (notes = '' OR notes IS NULL);
