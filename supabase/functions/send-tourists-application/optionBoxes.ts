/**
 * Option checkbox positions on the Tour & Care forms: question -> option -> [pageIndex, x, top].
 * Generated from the blank forms by matching each option label to the box beside it.
 */
export type OptionBoxes = Record<string, Record<string, [number, number, number]>>;

export const OPTION_BOXES_EN: OptionBoxes = {
    q1: { stroke: [1, 63.2, 148.3], epilepsy: [1, 107.6, 148.3], ms: [1, 159.1, 148.3], muscular: [1, 63.2, 158.3], headaches: [1, 63.2, 168.3], migraine: [1, 126.5, 168.3], dizziness: [1, 180.1, 168.3], balance: [1, 63.2, 178.3], fainting: [1, 157.4, 178.3], parkinson: [1, 209.3, 178.3], alzheimer: [1, 63.2, 188.3], retardation: [1, 131, 188.3], autism: [1, 236.2, 188.3], down: [1, 63.2, 198.3], cp: [1, 162.4, 198.3], polio: [1, 245.6, 198.3], gaucher: [1, 63.2, 208.3], numbness: [1, 155.6, 208.3], adhd: [1, 63.2, 218.3], memory: [1, 63.2, 228.3], other: [1, 63.2, 248.3] },
    q2: { hiv: [1, 63.2, 278.1], lupus: [1, 182.2, 278.1] },
    q3: { cataract: [1, 63.2, 304.7], retina: [1, 116.2, 304.7], cornea: [1, 207.8, 304.7], glaucoma: [1, 63.2, 314.7], inflammation: [1, 122.8, 314.7], strabismus: [1, 221.6, 314.7], blindness: [1, 63.2, 324.7], other: [1, 119.7, 324.7] },
    q4: { arrhythmia: [1, 63.2, 349.7], defects: [1, 128.7, 349.7], failure: [1, 213.4, 349.7], attack: [1, 63.2, 359.7], congenital: [1, 134, 359.7], catheter: [1, 63.2, 369.7], valves: [1, 231.3, 369.7], other: [1, 63.2, 379.7] },
    q5: { varicose: [1, 63.2, 404.8], carotid: [1, 169.7, 404.8], clotting: [1, 63.2, 414.8], anemia: [1, 158.8, 414.8], blood: [1, 207.2, 414.8], dvt: [1, 63.2, 424.8], pvd: [1, 156.1, 424.8] },
    q6: { thyroid: [1, 63.2, 449.9], lymph: [1, 141, 449.9], salivary: [1, 214.6, 449.9], sweat: [1, 63.2, 459.9], pituitary: [1, 134.8, 459.9], diabetes: [1, 216.4, 459.9], hypertension: [1, 63.2, 469.9], lipids: [1, 138.3, 469.9], other: [1, 63.2, 479.9] },
    q7: { asthma: [1, 63.2, 505], tbPast: [1, 111.3, 505], tbActive: [1, 63.2, 515], copd: [1, 63.2, 525], hayfever: [1, 63.2, 535], infections: [1, 119.1, 535], pneumothorax: [1, 63.2, 555], cf: [1, 145.6, 555], other: [1, 63.2, 565] },
    q8: { ulcer: [1, 63.2, 590.1], heartburn: [1, 214.5, 590.1], crohn: [1, 63.2, 600.1], colitis: [1, 146.2, 600.1], reflux: [1, 187.8, 600.1], hemorrhoids: [1, 230.5, 600.1], fissure: [1, 63.2, 610.1], blockage: [1, 141.2, 610.1], pancreas: [1, 63.2, 620.1], esophagus: [1, 213.2, 620.1], gallbladder: [1, 63.2, 630.1], gallstones: [1, 131.5, 630.1], other: [1, 193.6, 630.1] },
    q9: { hepBCD: [1, 63.2, 665.2], hepA: [1, 148.2, 665.2], fatty: [1, 211.2, 665.2], cirrhosis: [1, 270.5, 665.2], other: [1, 63.2, 675.2] },
    q10: { diaphragm: [1, 63.2, 700.3], umbilicus: [1, 138.2, 700.3], rightInguinal: [1, 206.3, 700.3], leftInguinal: [1, 63.2, 710.3], scar: [1, 135.2, 710.3], abdominal: [1, 63.2, 720.3] },
    q11: { infections: [1, 63.2, 745.3], cysts: [1, 63.2, 755.3], defects: [1, 148, 755.3], failure: [1, 63.2, 765.3], other: [1, 135.3, 765.3] },
    q12: { arthritis: [2, 63.2, 63.4], gout: [2, 113.8, 63.4], back: [2, 150.2, 63.4], knees: [2, 213, 63.4], hip: [2, 254, 63.4], shoulders: [2, 63.2, 73.4], joints: [2, 122.9, 73.4], osteoporosis: [2, 163.7, 73.4], other: [2, 63.2, 83.4] },
    q13: { skinTumors: [2, 63.2, 107.4], nevus: [2, 131.9, 107.4], psoriasis: [2, 194.4, 107.4], std: [2, 63.2, 117.4], syphilis: [2, 146.4, 117.4], otherSkin: [2, 63.2, 127.4], otherSex: [2, 201.1, 127.4] },
    q14: { activeYes: [2, 63.2, 171.3], activeNo: [2, 91.1, 171.3] },
    q15: { breastCyst: [2, 63.2, 196.4], augmentation: [2, 208.6, 196.4], fibrocystic: [2, 63.2, 206.4], uterineCyst: [2, 161.4, 206.4], fibroids: [2, 63.2, 216.4], endometriosis: [2, 148.4, 216.4], bleeding: [2, 227.5, 216.4], cervical: [2, 63.2, 226.4], ovarianCyst: [2, 177.5, 226.4], polycystic: [2, 63.2, 236.4], tubesCyst: [2, 150.9, 236.4], miscarriages: [2, 63.2, 246.4], ectopic: [2, 181.4, 246.4], caesarean: [2, 63.2, 256.4], pregnant: [2, 63.2, 266.4], other: [2, 63.2, 276.4] },
    q16: { prostate: [2, 63.2, 300.4], varicocele: [2, 161, 300.4], hydrocele: [2, 222.1, 300.4], other: [2, 63.2, 310.4] },
    q17: { depression: [2, 63.2, 336.5], anxiety: [2, 127.2, 336.5], other: [2, 175.1, 336.5] },
    q18: { apnea: [2, 63.2, 360.5], polyp: [2, 133.6, 360.5], sinusitis: [2, 208.1, 360.5], throat: [2, 63.2, 370.5], vocal: [2, 201.9, 370.5], adenoid: [2, 63.2, 380.5], concha: [2, 115.6, 380.5], snoring: [2, 232.8, 380.5], septum: [2, 63.2, 390.5], hearing: [2, 154.8, 390.5], neuroma: [2, 63.2, 400.5], eardrum: [2, 63.2, 410.5], tinnitus: [2, 140.8, 410.5], other: [2, 63.2, 420.5] },
    q20: { cannabis: [2, 63.2, 494.1] },
  };

export const OPTION_BOXES_HE: OptionBoxes = {
    q1: { stroke: [0, 526, 567.9], epilepsy: [0, 475.4, 567.9], ms: [0, 427.1, 567.9], muscular: [0, 526, 578.9], headaches: [0, 393.8, 578.9], migraine: [0, 343.8, 578.9], dizziness: [0, 526.2, 589.9], balance: [0, 455.1, 589.9], fainting: [0, 370.2, 589.9], parkinson: [0, 321.6, 589.9], alzheimer: [0, 526, 600.9], retardation: [0, 472.9, 600.9], autism: [0, 417.2, 600.9], down: [0, 375.3, 600.9], cp: [0, 526, 611.9], polio: [0, 465.8, 611.9], gaucher: [0, 436.3, 611.9], numbness: [0, 405.5, 611.9], adhd: [0, 526, 622.9], memory: [0, 526.4, 633.9], other: [0, 526.1, 644.9] },
    q2: { hiv: [0, 526, 657.1], lupus: [0, 526, 668.1] },
    q3: { cataract: [0, 526, 691.8], retina: [0, 485.8, 691.8], cornea: [0, 425.4, 691.8], glaucoma: [0, 368.9, 691.8], inflammation: [0, 526, 702.8], strabismus: [0, 468.2, 702.8], blindness: [0, 435, 702.8], other: [0, 526, 713.8] },
    q4: { arrhythmia: [0, 526, 737.1], defects: [0, 444.4, 737.1], failure: [0, 398.1, 737.1], attack: [0, 339.1, 737.1], congenital: [0, 526, 748.1], catheter: [0, 468, 748.1], valves: [0, 372.3, 748.1], other: [0, 526, 759.1] },
    q5: { varicose: [1, 526.1, 64.7], carotid: [1, 438.1, 64.7], clotting: [1, 526.1, 75.7], anemia: [1, 457.8, 75.7], blood: [1, 422.7, 75.7], dvt: [1, 375.7, 75.7], pvd: [1, 526.1, 86.7] },
    q6: { thyroid: [1, 526.1, 111.4], lymph: [1, 412.5, 111.4], salivary: [1, 345.3, 111.4], sweat: [1, 526.1, 122.4], pituitary: [1, 466.3, 122.4], diabetes: [1, 388, 122.4], hypertension: [1, 354.2, 122.4], lipids: [1, 526.1, 133.4], other: [1, 425.2, 133.4] },
    q7: { asthma: [1, 526.1, 158.1], tbPast: [1, 485.3, 158.1], copd: [1, 526.1, 169.1], hayfever: [1, 379.4, 169.1], infections: [1, 526.5, 180.1], pneumothorax: [1, 374.3, 180.1], cf: [1, 526.1, 191.1], other: [1, 454.8, 191.1] },
    q8: { ulcer: [1, 526.2, 215.7], heartburn: [1, 421.2, 215.7], crohn: [1, 389.5, 215.7], colitis: [1, 357.7, 215.7], reflux: [1, 318.7, 215.7], hemorrhoids: [1, 526.1, 226.7], fissure: [1, 487.2, 226.7], blockage: [1, 416.3, 226.7], pancreas: [1, 526.1, 237.7], esophagus: [1, 442.9, 237.7], gallbladder: [1, 415.2, 237.7], gallstones: [1, 371.5, 237.7], other: [1, 526.1, 248.7] },
    q9: { hepBCD: [1, 526.1, 273.4], hepA: [1, 426.9, 273.4], fatty: [1, 342.4, 273.4], cirrhosis: [1, 526.1, 284.4], other: [1, 489.3, 284.4] },
    q10: { diaphragm: [1, 526.1, 309.1], umbilicus: [1, 481.6, 309.1], rightInguinal: [1, 445.6, 309.1], leftInguinal: [1, 378.8, 309.1], scar: [1, 526.1, 320.1], abdominal: [1, 440.5, 320.1] },
    q11: { infections: [1, 526.1, 344.7], cysts: [1, 364.5, 344.7], defects: [1, 526.1, 355.7], failure: [1, 445.9, 355.7], other: [1, 526.1, 366.7] },
    q12: { arthritis: [1, 526.1, 391.4], gout: [1, 419.4, 391.4], back: [1, 389.7, 391.4], knees: [1, 324.2, 391.4], hip: [1, 526.1, 402.4], shoulders: [1, 491.4, 402.4], joints: [1, 452.8, 402.4], osteoporosis: [1, 410.7, 402.4], other: [1, 526.1, 413.4] },
    q13: { skinTumors: [1, 526.1, 438.1], nevus: [1, 481.1, 438.1], psoriasis: [1, 441.6, 438.1], std: [1, 393.9, 438.1], syphilis: [1, 346.3, 438.1], otherSkin: [1, 526.1, 449.1], otherSex: [1, 430.9, 449.1] },
    q14: { activeYes: [1, 461.5, 484.7], activeNo: [1, 485, 484.7] },
    q15: { breastCyst: [1, 526.1, 508], augmentation: [1, 412, 508], fibrocystic: [1, 361.2, 508], uterineCyst: [1, 526.1, 519], fibroids: [1, 425.5, 519], endometriosis: [1, 388.7, 519], bleeding: [1, 526.1, 530], cervical: [1, 455.7, 530], ovarianCyst: [1, 526.1, 541], polycystic: [1, 416.6, 541], tubesCyst: [1, 526.1, 552], miscarriages: [1, 412.2, 552], ectopic: [1, 351.3, 552], caesarean: [1, 526.1, 563], pregnant: [1, 526.1, 574], other: [1, 526.1, 585] },
    q16: { prostate: [1, 526.4, 608.3], varicocele: [1, 462.6, 608.3], hydrocele: [1, 421.2, 608.3], other: [1, 377.6, 608.3] },
    q17: { depression: [1, 526.1, 631.5], anxiety: [1, 494, 631.5], other: [1, 460.4, 631.5] },
    q18: { apnea: [1, 526.1, 654.8], polyp: [1, 420, 654.8], sinusitis: [1, 369.5, 654.8], throat: [1, 526.1, 665.8], vocal: [1, 450.2, 665.8], adenoid: [1, 369.3, 665.8], concha: [1, 526.1, 676.8], snoring: [1, 443.8, 676.8], septum: [1, 407, 676.8], hearing: [1, 526.1, 687.8], neuroma: [1, 441.5, 687.8], eardrum: [1, 526.1, 698.8], tinnitus: [1, 457.2, 698.8], other: [1, 423.2, 698.8] },
    q20: { cannabis: [2, 526.1, 64.7], other: [2, 526.1, 75.7] },
  };
