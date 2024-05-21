/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { io } from 'socket.io-client';
// import 'dotenv/config';

import { Queue, QueueStatus } from '../../../../types/queue';
import { ConnectionIDs } from '../../../../types/socket';
import { HandbrakePresetList } from '../../../../types/preset';
import { PrimaryOutletContextType } from './primary-context';

import SideBar from '../../components/side-bar/side-bar';

import './primary.scss';

export default function Primary() {
	const serverURL = import.meta.env.PROD ? window.location.href : 'http://localhost:9999';
	const serverSocketPath = 'client';
	const server = `${serverURL}${serverSocketPath}`;

	const [socket] = useState(io(server, { autoConnect: false }));
	const [queue, setQueue] = useState<Queue>({});
	const [queueStatus, setQueueStatus] = useState<QueueStatus>(QueueStatus.Idle);
	const [presets, setPresets] = useState<HandbrakePresetList>({});
	const [connections, setConnections] = useState<ConnectionIDs>({ clients: [], workers: [] });
	const [showSidebar, setShowSidebar] = useState(false);

	// Connect to server -------------------------------------------------------
	useEffect(() => {
		console.log(`[client] Connecting to '${server}...'`);
		socket.connect();

		return () => {
			socket.disconnect();
		};
	}, []);

	// Error event listeners ---------------------------------------------------
	const onConnect = () => {
		console.log(`[client] Connection established to '${server}'`);
	};

	const onConnectError = (error: Error) => {
		console.error(`[client] Error has occurred connecting to '${server}':`);
		console.error(error);
	};

	const onDisconnect = (reason: string) => {
		console.log(`[client] Disconnected from '${server}' because ${reason}`);
	};

	useEffect(() => {
		socket.on('connect', onConnect);
		socket.on('connect_error', onConnectError);
		socket.on('disconnect', onDisconnect);

		return () => {
			socket.off('connect', onConnect);
			socket.off('connect_error', onConnectError);
			socket.off('disconnect', onDisconnect);
		};
	});

	// Server event listeners --------------------------------------------------
	const onQueueUpdate = (queue: Queue) => {
		console.log(`[client] The queue has been updated.`);
		setQueue(queue);
	};

	const onQueueStatusUpdate = (queueStatus: QueueStatus) => {
		const prevStatus = queueStatus;
		console.log(`[client] The queue status has changed from ${prevStatus} to ${queueStatus}`);
		setQueueStatus(queueStatus);
	};

	const onPresetsUpdate = (presets: HandbrakePresetList) => {
		console.log('[client] Available presets have been updated.');
		setPresets(presets);
	};

	const onConnectionsUpdate = (data: ConnectionIDs) => {
		console.log(`[client] Connections have been updated.`);
		setConnections(data);
	};

	useEffect(() => {
		socket.on('queue-update', onQueueUpdate);
		socket.on('queue-status-update', onQueueStatusUpdate);
		socket.on('presets-update', onPresetsUpdate);
		socket.on('connections-update', onConnectionsUpdate);

		return () => {
			socket.off('queue-update', onQueueUpdate);
			socket.off('queue-status-update', onQueueStatusUpdate);
			socket.off('presets-update', onPresetsUpdate);
			socket.off('connections-update', onConnectionsUpdate);
		};
	});

	return (
		<div id='primary'>
			<SideBar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
			<div className={`dark-overlay ${showSidebar ? 'visible' : 'hidden'}`} />
			<div className='primary-section'>
				<div className='mobile-toolbar'>
					<div className='title'>
						<img src='/handbrake-icon.png' alt='Handbrake Icon' />
						<h1>HandBrake Web</h1>
					</div>
					<button onClick={() => setShowSidebar(!showSidebar)}>
						<i className='bi-list' />
					</button>
				</div>
				<div className='content'>
					<Outlet
						context={
							{
								socket,
								queue,
								queueStatus,
								presets,
								connections,
							} satisfies PrimaryOutletContextType
						}
					/>
				</div>
			</div>
		</div>
	);
}
