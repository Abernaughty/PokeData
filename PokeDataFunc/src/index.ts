import { app } from '@azure/functions';
import { getCardInfo } from './functions/getCardInfo';
import { getCardsBySet } from './functions/getCardsBySet';
import { getSetList } from './functions/getSetList';
import { refreshData } from './functions/refreshData';

// HTTP Functions - Register with app.http()
app.http('getCardInfo', {
    methods: ['GET'],
    authLevel: 'function',
    route: 'cards/{cardId}',
    handler: getCardInfo,
});

app.http('getCardsBySet', {
    methods: ['GET'],
    authLevel: 'function',
    route: 'sets/{setId}/cards',
    handler: getCardsBySet,
});

app.http('getSetList', {
    methods: ['GET'],
    authLevel: 'function',
    route: 'sets',
    handler: getSetList,
});

// Timer Function - Register with app.timer()
app.timer('refreshData', {
    schedule: '0 0 * * *', // Daily at midnight
    handler: refreshData,
});
