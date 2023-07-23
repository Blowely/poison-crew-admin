import Layout from "@/components/Layout";
import {useEffect, useState} from "react";
import axios from "axios";
import {message, Select} from "antd";
import {PRODUCT_STATUS} from "@/common/constants";

export default function OrdersPage() {
  const [orders,setOrders] = useState([]);
  useEffect(() => {
    axios.get('/api/orders?clientId=6484636d37ff0fc06c41aa03').then(response => {
      setOrders(response.data);
    });
  }, []);

  const statusOptions = Object.values(PRODUCT_STATUS).map((s,i) => ({
    key: i,
    value: s
  }))
  const clientId = '6484636d37ff0fc06c41aa03'
  const onChangeStatus = (orderId, status) => {
    axios.post('/api/updateStatus', {
        orderId,
        status,
        clientId
    })
        .then(response => {
          if (response?.data?.status === 'ok') {
            axios.get('/api/orders?clientId=6484636d37ff0fc06c41aa03').then(response => {
              setOrders(response.data);
              message.success('Статус изменен')
            });
          }
    }).catch(err => console.log('err=',err));
  }

  return (
    <Layout>
      <h1>Orders</h1>
      <table className="basic">
        <thead>
          <tr>
            <th>Date</th>
            <th>Paid</th>
            <th>Адрес</th>
            <th>Products</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
        {orders.length > 0 && orders.map(order => (
          <tr key={order._id} style={{borderBottom: '1px solid grey'}}>
            <td>{(new Date(order.createdAt)).toLocaleString()}
            </td>
            <td className={order?.paid ? 'text-green-600' : 'text-red-600'}>
              {order?.paid ? 'YES' : 'NO'}
            </td>
            <td>
              {order?.address?.address}
            </td>
            <td >
              {order?.products?.map((p) => (
                <div key={p._id} style={{borderBottom: '1px solid grey'}}>
                  {p.title}
                  <br/>
                  {p.size} размер
                  <br/>
                  {p.price} руб
                  <br/>
                </div>
              ))}
            </td>
            <td>
              <Select value={PRODUCT_STATUS[order.status?.toUpperCase()]}
                      defaultValue={PRODUCT_STATUS.CREATED}
                      options={statusOptions}
                      onChange={(status) => onChangeStatus(order._id, status)}
              ></Select>
            </td>
          </tr>
        ))}
        </tbody>
      </table>
    </Layout>
  );
}
