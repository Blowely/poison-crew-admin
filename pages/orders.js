import Layout from "@/components/Layout";
import {useEffect, useState} from "react";
import axios from "axios";
import {message, Select} from "antd";
import {PRODUCT_STATUS} from "@/common/constants";
import Link from "next/link";

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
            <th>id</th>
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
            <td>
              <span style={{fontSize: '10px'}}>{order._id}</span>
            </td>
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
                  <div>
                    <img src={p.images[0]} alt=""/>{p.title}
                    <br/>
                    {p.size} размер
                    <br/>
                    {p.price} руб
                    <br/>
                  </div>
                  <Link className="btn-default" href={'/products/edit/'+p._id}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    Edit
                  </Link>
                  <a href={p?.src}>poizon</a>
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
