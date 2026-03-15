## Long-Form Evaluation Harness

Run a controlled long-form execution and emit a summary report.

### Example
```powershell
python scripts/long_form_eval.py --project-id proj_esther_estate_verify_longform --chapter-id ch_0001 --scene-ids sc_0001,sc_0002,sc_0003,sc_0004,sc_0005 --chunk-size 1 --target-words 600
```

### Output
The summary is saved under:
```
<project>/.blackskies/long_form/eval/eval_<timestamp>.json
```
