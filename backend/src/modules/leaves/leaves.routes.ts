import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
    res.send('leaves module works');
});

export default router;
