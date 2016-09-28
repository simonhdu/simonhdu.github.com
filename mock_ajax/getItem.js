/**
 * Created by qianyongjun on 16/7/20.
 */
module.exports = function() {
  return {
    data: [
      {
        id:1,
        title: 'KM118',
        desc: 123,
        picUrl: '123',
        freightCfg: {
          isBaoyou: 9,
          itemMealList: [
            {
              num: 10,
              cost: 51
            }
          ]
        },
        price: 120,
        skus: [
          {
            id:1,
            itemId: 1,
            code: 123123123,
            title: 'KM118',
            desc: 123,
            picUrl: '123',
            price: 110
          },
          {
            id:1,
            itemId: 1,
            code: 123123123,
            title: 'KM118',
            desc: 123,
            picUrl: '123',
            price: 110
          }
        ]
      },
      {
        id:2,
        title: 'KM200',
        desc: 123,
        picUrl: '123',
        freightCfg: {
          isBaoyou: 9
        },
        price: 120,
        skus: [
          {
            id:1,
            itemId: 1,
            code: 123123123,
            title: 'KM118',
            desc: 123,
            picUrl: '123',
            price: 110
          },
          {
            id:1,
            itemId: 1,
            code: 123123123,
            title: 'KM118',
            desc: 123,
            picUrl: '123',
            price: 110
          }
        ]
      }
    ],
    result: 100
  }
};